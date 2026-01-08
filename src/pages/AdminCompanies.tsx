import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Plus, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateCNPJ, formatCNPJ, formatPhone, formatCEP } from '@/lib/validators';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    tipo_empresa: 'marketplace' as 'marketplace' | 'fabricante' | 'varejista',
    plano_atual: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('empresas')
      .select(`
        *,
        profiles:id_user (nome, email, telefone, cnpj)
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      setCompanies(data);
    }
  };

  const deleteCompany = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', companyId);
      
      if (error) throw error;
      
      toast({ 
        title: 'Empresa excluída!',
        description: 'A empresa foi removida do sistema'
      });
      
      loadCompanies();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateCompany = async () => {
    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Por favor, verifique o CNPJ informado',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.razao_social || !formData.nome_fantasia || !formData.cep || !formData.telefone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const tempEmail = `empresa_${formData.cnpj.replace(/\D/g, '')}@temp.com`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: Math.random().toString(36).slice(-12) + 'A1!',
        options: {
          data: {
            nome: formData.nome_fantasia,
            tipo_pessoa: 'PJ',
            cnpj: formData.cnpj,
            cep: formData.cep,
            logradouro: formData.logradouro,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            uf: formData.uf,
            telefone: formData.telefone,
            tipo_pj: 'empresa',
            role: 'empresa'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Insert empresa role for the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'empresa'
        });

      if (roleError) throw roleError;

      const { error: companyError } = await supabase
        .from('empresas')
        .insert({
          id_user: authData.user.id,
          tipo_empresa: formData.tipo_empresa,
          plano_atual: formData.plano_atual || null,
        });

      if (companyError) throw companyError;

      toast({
        title: 'Empresa criada!',
        description: 'A empresa foi cadastrada com sucesso'
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar empresa',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      telefone: '',
      tipo_empresa: 'marketplace',
      plano_atual: '',
    });
  };

  const getTipoEmpresaBadge = (tipo: string) => {
    const badges: any = {
      'marketplace': <Badge className="bg-primary">Marketplace</Badge>,
      'fabricante': <Badge className="bg-accent">Fabricante</Badge>,
      'varejista': <Badge className="bg-secondary">Varejista</Badge>
    };
    return badges[tipo] || <Badge>{tipo}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
              <p className="text-muted-foreground">Visualize e gerencie empresas parceiras</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6">
          {companies.map(company => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{company.profiles?.nome || 'Nome não disponível'}</CardTitle>
                    <CardDescription>CNPJ: {company.profiles?.cnpj || 'N/A'}</CardDescription>
                  </div>
                  {getTipoEmpresaBadge(company.tipo_empresa)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Informações
                    </h3>
                    {company.profiles?.email && (
                      <p className="text-sm text-muted-foreground">
                        Email: {company.profiles.email}
                      </p>
                    )}
                    {company.profiles?.telefone && (
                      <p className="text-sm text-muted-foreground">
                        Telefone: {company.profiles.telefone}
                      </p>
                    )}
                    {company.plano_atual && (
                      <p className="text-sm text-muted-foreground">
                        Plano: {company.plano_atual}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Métricas
                    </h3>
                    <div className="space-y-2">
                      {company.percentual_faturamento_verde !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Faturamento Verde:</span>
                          <span className="font-semibold">{company.percentual_faturamento_verde}%</span>
                        </div>
                      )}
                      {company.percentual_recuperacao !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa Recuperação:</span>
                          <span className="font-semibold">{company.percentual_recuperacao}%</span>
                        </div>
                      )}
                      {company.nivel_selo_venda_limpa && company.nivel_selo_venda_limpa !== 'Nenhum' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Selo Venda Limpa:</span>
                          <span className="font-semibold">{company.nivel_selo_venda_limpa}</span>
                        </div>
                      )}
                      {company.nivel_selo_origem && company.nivel_selo_origem !== 'Nenhum' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Selo Origem:</span>
                          <span className="font-semibold">{company.nivel_selo_origem}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/companies/${company.id}/metrics`)}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Métricas
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCompany(company.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {companies.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma empresa cadastrada ainda.
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              <DialogDescription>
                Adicione uma nova empresa parceira ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="razao_social">Razão Social *</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="tipo_empresa">Tipo de Empresa *</Label>
                <Select 
                  value={formData.tipo_empresa} 
                  onValueChange={(value: any) => setFormData({ ...formData, tipo_empresa: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="fabricante">Fabricante</SelectItem>
                    <SelectItem value="varejista">Varejista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plano_atual">Plano Atual</Label>
                <Input
                  id="plano_atual"
                  value={formData.plano_atual}
                  onChange={(e) => setFormData({ ...formData, plano_atual: e.target.value })}
                  placeholder="Ex: Premium, Básico, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateCompany}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Empresa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}