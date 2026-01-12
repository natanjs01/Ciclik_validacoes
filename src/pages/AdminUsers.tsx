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
import { ArrowLeft, User, Search, Trophy, Gift, Target, Edit, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [totalProfilesCount, setTotalProfilesCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, any>>({});
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});
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
    
    // Mostrar TODOS os usuários do banco, sem filtros
    const allUsers = data || [];setTotalProfilesCount(allUsers.length);
    setUsers(allUsers);
    setFilteredUsers(allUsers);
    
    // Verificar status de email de todos os usuários
    await checkEmailStatuses(allUsers);
  };

  const checkEmailStatuses = async (userList: any[]) => {
    const statuses: Record<string, any> = {};
    
    for (const user of userList) {
      try {
        const { data, error } = await supabase.rpc('verificar_status_email_frontend', {
          usuario_id: user.id
        });
        
        if (data && data.success) {
          statuses[user.id] = {
            emailConfirmed: data.email_confirmado,
            confirmedAt: data.confirmado_em,
            createdAt: data.criado_em
          };
        }
      } catch (error) {
        console.error(`Erro ao verificar status de email para ${user.email}:`, error);
      }
    }
    
    setEmailStatuses(statuses);
  };

  const getEmailStatusBadge = (userId: string) => {
    const status = emailStatuses[userId];
    
    if (!status) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Verificando...
        </Badge>
      );
    }
    
    if (status.emailConfirmed) {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Email confirmado
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Email não confirmado
      </Badge>
    );
  };

  const resendConfirmationEmail = async (user: any) => {
    const status = emailStatuses[user.id];
    
    if (status?.emailConfirmed) {
      toast({
        title: 'Email já confirmado',
        description: `O email de ${user.nome} já foi confirmado em ${new Date(status.confirmedAt).toLocaleDateString('pt-BR')}.`,
        variant: 'default',
      });
      return;
    }

    setSendingEmail(prev => ({ ...prev, [user.id]: true }));

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Email reenviado com sucesso!',
        description: `Email de confirmação reenviado para ${user.email}. Peça ao usuário para verificar a caixa de entrada e spam.`,
      });} catch (error: any) {
      console.error(`❌ [REENVIO] Erro ao reenviar email para ${user.email}:`, error);
      toast({
        title: 'Erro ao reenviar email',
        description: error.message || 'Ocorreu um erro ao tentar reenviar o email de confirmação.',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(prev => ({ ...prev, [user.id]: false }));
    }
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-lg">{user.nome}</CardTitle>
                            {getNivelBadge(user.nivel)}
                            {getTipoBadge(user.tipo_pessoa, user.tipo_pj)}
                            {getEmailStatusBadge(user.id)}
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

                      <div className="flex gap-2">
                        {!emailStatuses[user.id]?.emailConfirmed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendConfirmationEmail(user)}
                            disabled={sendingEmail[user.id]}
                            className="gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            {sendingEmail[user.id] ? 'Enviando...' : 'Reenviar Email'}
                          </Button>
                        )}
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

                {/* Status de Email */}
                {emailStatuses[selectedUser.id] && (
                  <Alert variant={emailStatuses[selectedUser.id].emailConfirmed ? "default" : "destructive"}>
                    {emailStatuses[selectedUser.id].emailConfirmed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {emailStatuses[selectedUser.id].emailConfirmed 
                        ? '✅ Email Confirmado' 
                        : '❌ Email Não Confirmado'}
                    </AlertTitle>
                    <AlertDescription>
                      {emailStatuses[selectedUser.id].emailConfirmed 
                        ? `Email confirmado em ${new Date(emailStatuses[selectedUser.id].confirmedAt).toLocaleDateString('pt-BR')}`
                        : 'O usuário ainda não confirmou o email. Use o botão "Reenviar Email" na lista de usuários para reenviar o email de confirmação.'}
                    </AlertDescription>
                  </Alert>
                )}
                
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