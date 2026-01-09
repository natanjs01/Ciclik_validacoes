import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Search, Trophy, Gift, Target, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(u => 
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpf?.includes(searchTerm) ||
        u.cnpj?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    // Buscar apenas profiles com dados válidos
    // Filtrar usuários que têm email e nome preenchidos (indicadores de registro completo)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (role)
      `)
      .not('email', 'is', null)
      .not('nome', 'is', null)
      .neq('email', '')
      .neq('nome', '')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [AdminUsers] Erro ao carregar profiles:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    // Filtrar apenas usuários com CPF ou CNPJ preenchido (usuários reais cadastrados)
    // Remove validação de tamanho pois pode ter máscara (pontos/traços)
    const validUsers = data?.filter(user => 
      (user.tipo_pessoa === 'PF' && user.cpf && user.cpf.trim().length > 0) ||
      (user.tipo_pessoa === 'PJ' && user.cnpj && user.cnpj.trim().length > 0)
    ) || [];
    
    // Remover duplicatas: manter apenas o registro mais recente por email/CPF/CNPJ
    const uniqueUsers = validUsers.reduce((acc: any[], current) => {
      // Usar email como chave primária de identificação
      const identifier = current.tipo_pessoa === 'PF' ? current.cpf : current.cnpj;
      
      // Verificar se já existe um usuário com o mesmo identificador
      const existingIndex = acc.findIndex(user => {
        const existingId = user.tipo_pessoa === 'PF' ? user.cpf : user.cnpj;
        return existingId === identifier || user.email === current.email;
      });
      
      if (existingIndex === -1) {
        // Não existe: adicionar
        acc.push(current);
      } else {
        // Existe: manter o mais recente (maior data de criação)
        const existing = acc[existingIndex];
        const existingDate = new Date(existing.created_at || existing.data_cadastro);
        const currentDate = new Date(current.created_at || current.data_cadastro);
        
        if (currentDate > existingDate) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []);
    
    console.log('✅ [AdminUsers] Total de profiles no banco:', data?.length);
    console.log('✅ [AdminUsers] Usuários válidos (com documento):', validUsers.length);
    console.log('✅ [AdminUsers] Usuários únicos (sem duplicatas):', uniqueUsers.length);
    console.log('📊 [AdminUsers] Duplicatas removidas:', validUsers.length - uniqueUsers.length);
    
    setUsers(uniqueUsers);
    setFilteredUsers(uniqueUsers);
  };

  const updateUserScore = async (userId: string, newScore: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ score_verde: newScore })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({ title: 'Score atualizado!' });
      loadUsers();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getNivelBadge = (nivel: string) => {
    const badges: any = {
      'Iniciante': <Badge variant="secondary">Iniciante</Badge>,
      'Ativo': <Badge className="bg-success">Ativo</Badge>,
      'Guardiao Verde': <Badge className="bg-accent">Guardião Verde</Badge>
    };
    return badges[nivel] || <Badge>{nivel}</Badge>;
  };

  const getTipoBadge = (tipo: string, tipo_pj?: string) => {
    if (tipo === 'PF') return <Badge variant="outline">Pessoa Física</Badge>;
    return <Badge variant="outline">PJ - {tipo_pj}</Badge>;
  };

  const filterByType = (type: string) => {
    if (type === 'all') return filteredUsers;
    if (type === 'pf') return filteredUsers.filter(u => u.tipo_pessoa === 'PF');
    if (type === 'pj') return filteredUsers.filter(u => u.tipo_pessoa === 'PJ');
    return filteredUsers.filter(u => u.nivel === type);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
              <p className="text-muted-foreground">Ver e editar informações dos usuários</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total de Usuários</CardDescription>
              <CardTitle className="text-2xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Pessoas Físicas</CardDescription>
              <CardTitle className="text-2xl">
                {users.filter(u => u.tipo_pessoa === 'PF').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Pessoas Jurídicas</CardDescription>
              <CardTitle className="text-2xl">
                {users.filter(u => u.tipo_pessoa === 'PJ').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Guardiões Verde</CardDescription>
              <CardTitle className="text-2xl">
                {users.filter(u => u.nivel === 'Guardiao Verde').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users List */}
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pf">PF</TabsTrigger>
            <TabsTrigger value="pj">PJ</TabsTrigger>
            <TabsTrigger value="Ativo">Ativos</TabsTrigger>
            <TabsTrigger value="Guardiao Verde">Guardiões</TabsTrigger>
          </TabsList>

          {['all', 'pf', 'pj', 'Ativo', 'Guardiao Verde'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterByType(tab).map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-full bg-primary/10 p-2">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{user.nome}</CardTitle>
                            {getNivelBadge(user.nivel)}
                            {getTipoBadge(user.tipo_pessoa, user.tipo_pj)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div><strong>Email:</strong> {user.email}</div>
                            <div><strong>Telefone:</strong> {user.telefone || 'N/A'}</div>
                            {user.tipo_pessoa === 'PF' ? (
                              <div><strong>CPF:</strong> {user.cpf}</div>
                            ) : (
                              <div><strong>CNPJ:</strong> {user.cnpj}</div>
                            )}
                            <div>
                              <strong>Endereço:</strong> {user.logradouro}, {user.numero || 'S/N'} - {user.bairro}, {user.cidade}/{user.uf}
                            </div>
                            <div className="text-xs pt-1">
                              Cadastrado em: {new Date(user.data_cadastro).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Trophy className="h-4 w-4 text-primary mr-1" />
                        </div>
                        <p className="text-2xl font-bold text-primary">{user.score_verde}</p>
                        <p className="text-xs text-muted-foreground">Pontos Verdes</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Target className="h-4 w-4 text-success mr-1" />
                        </div>
                        <p className="text-2xl font-bold">{user.missoes_concluidas}</p>
                        <p className="text-xs text-muted-foreground">Missões</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Gift className="h-4 w-4 text-accent mr-1" />
                        </div>
                        <p className="text-2xl font-bold">{user.cupons_resgatados}</p>
                        <p className="text-xs text-muted-foreground">Cupons</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filterByType(tab).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">{selectedUser.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Score Verde (pontos)</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={selectedUser.score_verde}
                    id="novo-score"
                  />
                  <p className="text-xs text-muted-foreground">
                    Score atual: {selectedUser.score_verde} | Nível: {selectedUser.nivel}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const input = document.getElementById('novo-score') as HTMLInputElement;
                    updateUserScore(selectedUser.id, parseInt(input.value));
                  }}
                  className="w-full"
                >
                  Atualizar Score
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}