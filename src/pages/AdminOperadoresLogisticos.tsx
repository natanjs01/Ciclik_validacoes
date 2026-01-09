import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle, Pause, Star, TrendingUp, Package, Plus, FileText, Trash2, MoreVertical, Download, Search, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { validateCNPJ, formatCNPJ, formatPhone, formatCEP } from '@/lib/validators';
import { appUrl } from '@/lib/appUrl';

type TipoOperador = 'cooperativa' | 'rota_ciclik' | 'operador_parceiro';

export default function AdminOperadoresLogisticos() {
  const [operadores, setOperadores] = useState<any[]>([]);
  const [selectedOp, setSelectedOp] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEmailHistoryOpen, setIsEmailHistoryOpen] = useState(false);
  const [isEditEmailDialogOpen, setIsEditEmailDialogOpen] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    whatsapp: '',
    capacidade_mensal_ton: '',
    tipo_operador: 'cooperativa' as TipoOperador,
    tipo_pj: 'Outro' as 'Condominio' | 'Restaurante' | 'Comercio' | 'Servico' | 'Industria' | 'Outro'
  });
  const [docConstituicao, setDocConstituicao] = useState<File | null>(null);
  const [docRepresentante, setDocRepresentante] = useState<File | null>(null);
  const [searchCNPJ, setSearchCNPJ] = useState('');
  const [searchUF, setSearchUF] = useState('all');
  const [filterTipoOperador, setFilterTipoOperador] = useState<'all' | TipoOperador>('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadOperadores();
  }, []);

  const loadOperadores = async () => {
    const { data } = await supabase
      .from('cooperativas')
      .select('*')
      .order('data_cadastro', { ascending: false });
    
    if (data) {
      setOperadores(data);
      data.forEach(loadOpStats);
    }
  };

  const loadOpStats = async (op: any) => {
    const { data: entregas } = await supabase
      .from('entregas_reciclaveis')
      .select('peso_validado, status')
      .eq('id_cooperativa', op.id);

    const totalEntregas = entregas?.length || 0;
    const pesoTotal = entregas?.reduce((acc, e) => acc + (e.peso_validado || 0), 0) || 0;
    const validadas = entregas?.filter(e => e.status === 'validada').length || 0;

    setStats((prev: any) => ({
      ...prev,
      [op.id]: { totalEntregas, pesoTotal, validadas }
    }));
  };

  const updateStatus = async (opId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cooperativas')
        .update({ status: newStatus })
        .eq('id', opId);
      
      if (error) throw error;
      
      toast({ 
        title: 'Status atualizado!',
        description: `Operador ${newStatus === 'aprovada' ? 'aprovado' : newStatus === 'suspensa' ? 'bloqueado' : 'atualizado'} com sucesso` 
      });
      
      loadOperadores();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updatePontuacao = async (opId: string, novaPontuacao: number) => {
    try {
      const { error } = await supabase
        .from('cooperativas')
        .update({ pontuacao_confiabilidade: novaPontuacao })
        .eq('id', opId);
      
      if (error) throw error;
      
      toast({ title: 'Pontuação atualizada!' });
      loadOperadores();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteOp = async (opId: string) => {
    if (!confirm('Tem certeza que deseja excluir este operador? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cooperativas')
        .delete()
        .eq('id', opId);
      
      if (error) throw error;
      
      toast({ 
        title: 'Operador excluído!',
        description: 'O operador foi removido do sistema'
      });
      
      loadOperadores();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadEmailHistory = async (opId: string) => {
    try {
      const { data, error } = await supabase
        .from('emails_cooperativas')
        .select('*')
        .eq('id_cooperativa', opId)
        .order('data_envio', { ascending: false });
      
      if (error) throw error;
      
      setEmailHistory(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditEmailAndResend = async () => {
    if (!selectedOp || !editEmailValue) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, informe um email válido',
        variant: 'destructive'
      });
      return;
    }

    if (!editEmailValue.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, informe um email válido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('cooperativas')
        .update({ email: editEmailValue })
        .eq('id', selectedOp.id);

      if (updateError) throw updateError;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        editEmailValue,
        {
          redirectTo: appUrl('/reset-password')
        }
      );

      if (resetError) throw resetError;

      // Edge Function desabilitada temporariamente (problema de CORS)
      /*
      const { error: emailError } = await supabase.functions.invoke('enviar-convite-cooperativa', {
        body: {
          email: editEmailValue,
          nomeFantasia: selectedOp.nome_fantasia,
          resetLink: appUrl('/reset-password'),
          idCooperativa: selectedOp.id
        }
      });

      if (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
      */

      toast({
        title: 'Sucesso! ✅',
        description: `Email atualizado para ${editEmailValue} e link de reset enviado.`
      });

      setIsEditEmailDialogOpen(false);
      setEditEmailValue('');
      loadOperadores();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, opId: string, type: 'constituicao' | 'representante') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${opId}/${type}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cooperative-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('cooperative-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleCreateOp = async () => {
    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Por favor, verifique o CNPJ informado',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.razao_social || !formData.nome_fantasia || !formData.cep || !formData.whatsapp || !formData.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios, incluindo o email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + 'A1!',
        options: {
          data: {
            nome: formData.nome_fantasia,
            tipo_pessoa: 'PJ',
            tipo_pj: formData.tipo_pj,
            cnpj: formData.cnpj,
            cep: formData.cep,
            logradouro: formData.logradouro,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            uf: formData.uf,
            telefone: formData.whatsapp,
            role: 'cooperativa'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // Aguardar o trigger handle_new_user criar o profile e role
      // (pequeno delay para garantir que o trigger complete)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: opData, error: opError } = await supabase
        .from('cooperativas')
        .insert({
          id_user: authData.user.id,
          cnpj: formData.cnpj,
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          email: formData.email,
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          whatsapp: formData.whatsapp,
          capacidade_mensal_ton: formData.capacidade_mensal_ton ? parseFloat(formData.capacidade_mensal_ton) : null,
          tipo_operador: formData.tipo_operador,
          status: 'aprovada'
        })
        .select()
        .single();

      if (opError) throw opError;

      if (docConstituicao && opData) {
        const urlConstituicao = await uploadDocument(docConstituicao, opData.id, 'constituicao');
        await supabase
          .from('cooperativas')
          .update({ documento_constituicao_url: urlConstituicao })
          .eq('id', opData.id);
      }

      if (docRepresentante && opData) {
        const urlRepresentante = await uploadDocument(docRepresentante, opData.id, 'representante');
        await supabase
          .from('cooperativas')
          .update({ documento_representante_url: urlRepresentante })
          .eq('id', opData.id);
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: appUrl('/reset-password')
        }
      );

      if (!resetError) {
        // Edge Function desabilitada temporariamente (problema de CORS)
        // TODO: Corrigir CORS na Edge Function enviar-convite-cooperativa
        /*
        try {
          const { error: emailError } = await supabase.functions.invoke('enviar-convite-cooperativa', {
            body: {
              email: formData.email,
              nomeFantasia: formData.nome_fantasia,
              resetLink: `${window.location.origin}/reset-password`,
              idCooperativa: opData.id
            }
          });

          if (emailError) {
            console.error('Erro ao enviar email de convite:', emailError);
          }
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
        }
        */
        
        toast({
          title: 'Operador criado com sucesso! ✅',
          description: `Email de reset de senha enviado para ${formData.email}. O operador deve verificar a caixa de entrada.`
        });
      } else {
        toast({
          title: 'Operador criado!',
          description: 'O operador foi cadastrado com sucesso'
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      loadOperadores();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar operador',
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
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      whatsapp: '',
      capacidade_mensal_ton: '',
      tipo_operador: 'cooperativa',
      tipo_pj: 'Outro'
    });
    setDocConstituicao(null);
    setDocRepresentante(null);
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'aprovada': <Badge className="bg-success">Aprovada</Badge>,
      'pendente_aprovacao': <Badge className="bg-warning">Pendente</Badge>,
      'suspensa': <Badge variant="destructive">Bloqueada</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  const getTipoOperadorBadge = (tipo: TipoOperador) => {
    const badges = {
      'cooperativa': <Badge variant="default" className="bg-success">Cooperativa</Badge>,
      'rota_ciclik': <Badge variant="default" className="bg-primary">Rota Ciclik</Badge>,
      'operador_parceiro': <Badge variant="default" className="bg-secondary">Operador Parceiro</Badge>
    };
    return badges[tipo] || <Badge>{tipo}</Badge>;
  };

  const getTipoOperadorLabel = (tipo: TipoOperador) => {
    const labels = {
      'cooperativa': 'Cooperativa',
      'rota_ciclik': 'Rota Ciclik',
      'operador_parceiro': 'Operador Parceiro'
    };
    return labels[tipo] || tipo;
  };

  const filterByStatus = (status: string) => {
    let filtered = status === 'all' ? operadores : operadores.filter(o => o.status === status);
    
    if (searchCNPJ) {
      filtered = filtered.filter(o => o.cnpj.includes(searchCNPJ));
    }
    
    if (searchUF !== 'all') {
      filtered = filtered.filter(o => o.uf === searchUF);
    }

    if (filterTipoOperador !== 'all') {
      filtered = filtered.filter(o => o.tipo_operador === filterTipoOperador);
    }
    
    return filtered;
  };

  const exportToExcel = () => {
    const data = operadores.map(op => ({
      'Tipo': getTipoOperadorLabel(op.tipo_operador),
      'Nome Fantasia': op.nome_fantasia,
      'Razão Social': op.razao_social,
      'CNPJ': op.cnpj,
      'CEP': op.cep,
      'Logradouro': op.logradouro,
      'Número': op.numero,
      'Bairro': op.bairro,
      'Cidade': op.cidade,
      'UF': op.uf,
      'WhatsApp': op.whatsapp,
      'Status': op.status,
      'Confiabilidade': op.pontuacao_confiabilidade,
      'Total Entregas': stats[op.id]?.totalEntregas || 0,
      'Peso Total (kg)': stats[op.id]?.pesoTotal?.toFixed(2) || 0,
      'Entregas Validadas': stats[op.id]?.validadas || 0,
      'Data Cadastro': new Date(op.data_cadastro).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operadores Logísticos');
    XLSX.writeFile(wb, `operadores_logisticos_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Exportado com sucesso!',
      description: 'Arquivo Excel baixado'
    });
  };

  const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Operador
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">Gestão de Operadores Logísticos</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search-cnpj">Buscar por CNPJ</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-cnpj"
                    placeholder="Digite o CNPJ..."
                    value={searchCNPJ}
                    onChange={(e) => setSearchCNPJ(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="search-uf">Filtrar por Estado</Label>
                <select
                  id="search-uf"
                  value={searchUF}
                  onChange={(e) => setSearchUF(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Todos os Estados</option>
                  {estadosBrasil.map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="filter-tipo">Filtrar por Tipo</Label>
                <Select value={filterTipoOperador} onValueChange={(value) => setFilterTipoOperador(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="cooperativa">Cooperativas</SelectItem>
                    <SelectItem value="rota_ciclik">Rotas Ciclik</SelectItem>
                    <SelectItem value="operador_parceiro">Operadores Parceiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchCNPJ('');
                    setSearchUF('all');
                    setFilterTipoOperador('all');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pendente_aprovacao">Pendentes</TabsTrigger>
            <TabsTrigger value="aprovada">Aprovados</TabsTrigger>
            <TabsTrigger value="suspensa">Bloqueados</TabsTrigger>
          </TabsList>

          {['all', 'pendente_aprovacao', 'aprovada', 'suspensa'].map(status => (
            <TabsContent key={status} value={status}>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Confiabilidade</TableHead>
                      <TableHead className="text-center">Entregas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterByStatus(status).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground h-32">
                          Nenhum operador encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterByStatus(status).map(op => (
                        <TableRow key={op.id}>
                          <TableCell>{getTipoOperadorBadge(op.tipo_operador)}</TableCell>
                          <TableCell className="font-medium">{op.nome_fantasia}</TableCell>
                          <TableCell>{op.razao_social}</TableCell>
                          <TableCell className="text-sm">{op.cnpj}</TableCell>
                          <TableCell className="text-sm">{op.email || 'Não informado'}</TableCell>
                          <TableCell className="text-sm">{op.cidade}/{op.uf}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(op.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="font-semibold">{op.pontuacao_confiabilidade || 100}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {stats[op.id]?.totalEntregas || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {op.status === 'pendente_aprovacao' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus(op.id, 'aprovada')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </DropdownMenuItem>
                                )}
                                {op.status === 'aprovada' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus(op.id, 'suspensa')}
                                    className="text-destructive"
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Bloquear
                                  </DropdownMenuItem>
                                )}
                                {op.status === 'suspensa' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatus(op.id, 'aprovada')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Desbloquear
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOp(op);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Ajustar Pontuação
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOp(op);
                                    setEditEmailValue(op.email || '');
                                    setIsEditEmailDialogOpen(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Editar Email e Reenviar Convite
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOp(op);
                                    loadEmailHistory(op.id);
                                    setIsEmailHistoryOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Histórico de Emails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteOp(op.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Dialog de Ajustar Pontuação */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Pontuação de Confiabilidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Operador</Label>
                <p className="text-sm">{selectedOp?.nome_fantasia}</p>
              </div>
              <div>
                <Label htmlFor="pontuacao">Nova Pontuação (0-100)</Label>
                <Input
                  id="pontuacao"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={selectedOp?.pontuacao_confiabilidade || 100}
                  onChange={(e) => {
                    if (selectedOp) {
                      setSelectedOp({ ...selectedOp, pontuacao_confiabilidade: parseInt(e.target.value) });
                    }
                  }}
                />
              </div>
              <Button 
                onClick={() => updatePontuacao(selectedOp?.id, selectedOp?.pontuacao_confiabilidade)}
                className="w-full"
              >
                Atualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar Operador */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Operador Logístico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tipo_operador">Tipo de Operador *</Label>
                <Select value={formData.tipo_operador} onValueChange={(value) => setFormData({ ...formData, tipo_operador: value as TipoOperador })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooperativa">Cooperativa</SelectItem>
                    <SelectItem value="rota_ciclik">Rota Ciclik</SelectItem>
                    <SelectItem value="operador_parceiro">Operador Parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@operador.com"
                />
              </div>

              <div>
                <Label htmlFor="tipo_pj">Tipo de Organização *</Label>
                <select
                  id="tipo_pj"
                  value={formData.tipo_pj}
                  onChange={(e) => setFormData({ ...formData, tipo_pj: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Condominio">Condomínio</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Comercio">Comércio</option>
                  <option value="Servico">Serviço</option>
                  <option value="Industria">Indústria</option>
                  <option value="Outro">Outro</option>
                </select>
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

              <div>
                <Label htmlFor="capacidade">Capacidade Mensal (toneladas)</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={formData.capacidade_mensal_ton}
                  onChange={(e) => setFormData({ ...formData, capacidade_mensal_ton: e.target.value })}
                  placeholder="0.0"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="doc_constituicao">Documento de Constituição</Label>
                <Input
                  id="doc_constituicao"
                  type="file"
                  onChange={(e) => setDocConstituicao(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <div>
                <Label htmlFor="doc_representante">Documento do Representante</Label>
                <Input
                  id="doc_representante"
                  type="file"
                  onChange={(e) => setDocRepresentante(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <Button 
                onClick={handleCreateOp}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Criando...' : 'Criar Operador'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar Email */}
        <Dialog open={isEditEmailDialogOpen} onOpenChange={setIsEditEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Email e Reenviar Convite</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Operador</Label>
                <p className="text-sm">{selectedOp?.nome_fantasia}</p>
              </div>
              <div>
                <Label htmlFor="novo_email">Novo Email</Label>
                <Input
                  id="novo_email"
                  type="email"
                  value={editEmailValue}
                  onChange={(e) => setEditEmailValue(e.target.value)}
                  placeholder="novo@email.com"
                />
              </div>
              <Button 
                onClick={handleEditEmailAndResend}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processando...' : 'Atualizar e Reenviar Convite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Histórico de Emails */}
        <Dialog open={isEmailHistoryOpen} onOpenChange={setIsEmailHistoryOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Emails - {selectedOp?.nome_fantasia}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {emailHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum email enviado</p>
              ) : (
                <div className="space-y-4">
                  {emailHistory.map((email) => (
                    <Card key={email.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{email.assunto}</p>
                              <p className="text-sm text-muted-foreground">{email.tipo_email}</p>
                            </div>
                            <Badge className={email.status_envio === 'enviado' ? 'bg-success' : 'bg-destructive'}>
                              {email.status_envio}
                            </Badge>
                          </div>
                          <p className="text-sm"><strong>Para:</strong> {email.email_destino}</p>
                          <p className="text-sm"><strong>Data:</strong> {new Date(email.data_envio).toLocaleString('pt-BR')}</p>
                          {email.mensagem_erro && (
                            <p className="text-sm text-destructive"><strong>Erro:</strong> {email.mensagem_erro}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}