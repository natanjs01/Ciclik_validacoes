import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, Mail, Phone, Users, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, History, RefreshCw, Send, XCircle, Copy, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Investor {
  id: string;
  razao_social: string;
  cnpj: string;
  email: string;
  nome_responsavel: string;
  telefone: string | null;
  status: string;
  data_cadastro: string;
  convite_enviado: boolean;
  data_convite: string | null;
  primeiro_acesso: boolean;
  quotas_count?: number;
}

interface InvestorStats {
  totalActiveInvestors: number;
  totalQuotasAssigned: number;
  totalValueInvested: number;
}

interface EmailHistory {
  id: string;
  email_destino: string;
  tipo_email: string;
  assunto: string;
  status_envio: string;
  mensagem_erro: string | null;
  created_at: string;
}

const AdminCDVInvestors = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [stats, setStats] = useState<InvestorStats>({
    totalActiveInvestors: 0,
    totalQuotasAssigned: 0,
    totalValueInvested: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj: "",
    email: "",
    nome_responsavel: "",
    telefone: ""
  });
  const [creating, setCreating] = useState(false);
  
  // Estados para histórico de emails
  const [emailHistoryDialogOpen, setEmailHistoryDialogOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [loadingEmailHistory, setLoadingEmailHistory] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchInvestors();
    fetchStats();
  }, []);

  const fetchInvestors = async () => {
    try {
      // Buscar investidores
      const { data: investorsData, error } = await supabase
        .from("cdv_investidores")
        .select("*")
        .order("data_cadastro", { ascending: false });

      if (error) throw error;

      // Para cada investidor, contar quotas atribuídas
      const investorsWithQuotas = await Promise.all(
        (investorsData || []).map(async (inv) => {
          const { count } = await supabase
            .from("cdv_quotas")
            .select("*", { count: "exact", head: true })
            .eq("id_investidor", inv.id);
          
          return { ...inv, quotas_count: count || 0 };
        })
      );

      setInvestors(investorsWithQuotas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar investidores",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total de investidores ativos
      const { count: activeCount, error: countError } = await supabase
        .from("cdv_investidores")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      if (countError) throw countError;

      // Total de quotas atribuídas e valor investido
      const { data: quotasData, error: quotasError } = await supabase
        .from("cdv_quotas")
        .select("valor_pago")
        .not("id_investidor", "is", null);

      if (quotasError) throw quotasError;

      const totalQuotas = quotasData?.length || 0;
      const totalValue = quotasData?.reduce((sum, q) => sum + (q.valor_pago || 0), 0) || 0;

      setStats({
        totalActiveInvestors: activeCount || 0,
        totalQuotasAssigned: totalQuotas,
        totalValueInvested: totalValue
      });
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleCreateInvestor = async () => {
    if (!formData.razao_social || !formData.cnpj || !formData.email || !formData.nome_responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);

      // Apenas criar registro em cdv_investidores SEM criar usuário auth
      // O usuário será criado automaticamente quando quotas forem atribuídas
      const { error: investorError } = await supabase
        .from("cdv_investidores")
        .insert({
          id_user: crypto.randomUUID(), // ID temporário, será substituído quando usuário for criado
          razao_social: formData.razao_social,
          cnpj: formData.cnpj,
          email: formData.email,
          nome_responsavel: formData.nome_responsavel,
          telefone: formData.telefone || null,
          status: "aguardando_quotas",
          convite_enviado: false
        });

      if (investorError) throw investorError;

      toast({
        title: "Investidor cadastrado",
        description: "O investidor receberá um email de acesso quando quotas forem atribuídas."
      });

      setIsDialogOpen(false);
      setFormData({
        razao_social: "",
        cnpj: "",
        email: "",
        nome_responsavel: "",
        telefone: ""
      });
      fetchInvestors();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erro ao criar investidor",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Carregar histórico de emails do investidor
  const loadEmailHistory = async (investor: Investor) => {
    setSelectedInvestor(investor);
    setEmailHistoryDialogOpen(true);
    setLoadingEmailHistory(true);
    
    try {
      const { data, error } = await supabase
        .from("emails_investidores")
        .select("*")
        .eq("id_investidor", investor.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setEmailHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingEmailHistory(false);
    }
  };

  // Enviar/Reenviar convite para investidor
  const handleSendInvite = async (investor: Investor, isResend: boolean = false) => {
    // Se não é reenvio e não tem quotas, bloquear
    if (!isResend && (investor.quotas_count || 0) === 0) {
      toast({
        title: "Ação não permitida",
        description: "Este investidor ainda não possui quotas atribuídas. Atribua quotas primeiro.",
        variant: "destructive"
      });
      return;
    }

    setResendingInvite(true);
    
    try {
      // Toda a lógica de criação de usuário e geração do link é feita na edge function
      const { data, error } = await supabase.functions.invoke("enviar-convite-investidor", {
        body: {
          email: investor.email,
          razaoSocial: investor.razao_social,
          nomeResponsavel: investor.nome_responsavel,
          cnpj: investor.cnpj,
          idInvestidor: investor.id,
          reenvio: isResend,
          originUrl: window.location.origin // Enviar URL atual (preview ou produção)
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Mostrar o link de acesso para o admin copiar e enviar manualmente
      if (data?.accessLink) {
        // Copiar para área de transferência
        await navigator.clipboard.writeText(data.accessLink);
        
        toast({
          title: "Link de acesso gerado!",
          description: (
            <div className="space-y-2">
              <p>O link foi copiado para sua área de transferência.</p>
              <p className="text-xs text-muted-foreground">
                Envie este link para {investor.email} via WhatsApp ou email.
              </p>
            </div>
          ),
          duration: 10000
        });
      } else {
        toast({
          title: isResend ? "Convite reenviado" : "Convite enviado",
          description: `Convite processado para ${investor.email}`
        });
      }

      // Recarregar dados
      fetchInvestors();
      
      // Recarregar histórico se estiver aberto
      if (emailHistoryDialogOpen && selectedInvestor?.id === investor.id) {
        await loadEmailHistory(investor);
      }
    } catch (error: any) {
      toast({
        title: `Erro ao ${isResend ? 're' : ''}enviar convite`,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResendingInvite(false);
    }
  };

  const getStatusBadge = (investor: Investor) => {
    const hasQuotas = (investor.quotas_count || 0) > 0;
    
    // Se tem quotas mas não recebeu convite: mostrar alerta para enviar convite
    if (hasQuotas && !investor.convite_enviado) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600 cursor-help">
                <AlertCircle className="h-3 w-3" />
                Enviar Convite
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Possui {investor.quotas_count} quota(s) mas convite não foi enviado</p>
              <p className="text-xs text-muted-foreground">Clique no ícone de enviar para convidar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Se não tem quotas e não recebeu convite: aguardando quotas
    if (!hasQuotas && !investor.convite_enviado) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Aguardando Quotas
        </Badge>
      );
    }

    // Se recebeu convite mas não acessou: convite pendente
    if (investor.convite_enviado && !investor.primeiro_acesso) {
      const daysSinceInvite = investor.data_convite 
        ? Math.floor((Date.now() - new Date(investor.data_convite).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-600 cursor-help">
                <AlertCircle className="h-3 w-3" />
                Convite Pendente
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Convite enviado há {daysSinceInvite} dia(s)</p>
              {investor.data_convite && (
                <p className="text-xs text-muted-foreground">
                  {new Date(investor.data_convite).toLocaleString('pt-BR')}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Ativo: recebeu convite e já acessou
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    );
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case "enviado":
        return <Badge variant="default" className="bg-green-600">Enviado</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "erro":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvestors = investors.filter(inv =>
    inv.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.cnpj.includes(searchTerm) ||
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investidores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveInvestors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Empresas investidoras cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quotas Atribuídas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotasAssigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de quotas vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Investido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValueInvested)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Investimento acumulado em CDV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Investidores */}
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Investidores CDV</CardTitle>
            <CardDescription>
              Gerenciar empresas investidoras. O convite de acesso é enviado automaticamente quando quotas são atribuídas.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Investidor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Investidor</DialogTitle>
                <DialogDescription>
                  Preencha os dados da empresa investidora. O convite de acesso será enviado automaticamente quando você atribuir quotas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nome_responsavel">Nome do Responsável *</Label>
                  <Input
                    id="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone (opcional)</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateInvestor} disabled={creating}>
                  {creating ? "Cadastrando..." : "Cadastrar Investidor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestors.map((investor) => (
              <TableRow key={investor.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{investor.razao_social}</span>
                  </div>
                </TableCell>
                <TableCell>{investor.cnpj}</TableCell>
                <TableCell>{investor.nome_responsavel}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {investor.email}
                    </div>
                    {investor.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {investor.telefone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(investor)}
                </TableCell>
                <TableCell>
                  {new Date(investor.data_cadastro).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => loadEmailHistory(investor)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver histórico de emails</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Mostrar botão de enviar/reenviar convite */}
                    {/* Se tem quotas mas não recebeu convite: mostrar "Enviar Convite" */}
                    {!investor.convite_enviado && (investor.quotas_count || 0) > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendInvite(investor, false)}
                              disabled={resendingInvite}
                              className="text-primary"
                            >
                              {resendingInvite ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enviar convite (possui {investor.quotas_count} quota(s))</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* Se já recebeu convite mas não acessou: mostrar "Reenviar Convite" */}
                    {investor.convite_enviado && !investor.primeiro_acesso && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendInvite(investor, true)}
                              disabled={resendingInvite}
                            >
                              {resendingInvite ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reenviar convite</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredInvestors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum investidor encontrado
          </div>
        )}
      </CardContent>
    </Card>

      {/* Dialog de Histórico de Emails */}
      <Dialog open={emailHistoryDialogOpen} onOpenChange={setEmailHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Emails
            </DialogTitle>
            <DialogDescription>
              {selectedInvestor && (
                <span>
                  Emails enviados para <strong>{selectedInvestor.razao_social}</strong> ({selectedInvestor.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {loadingEmailHistory ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum email enviado para este investidor</p>
              <p className="text-sm mt-2">
                {selectedInvestor && (selectedInvestor.quotas_count || 0) > 0 
                  ? `Este investidor possui ${selectedInvestor.quotas_count} quota(s) atribuída(s). Clique em "Enviar Convite" abaixo para enviar o email de acesso.`
                  : "O primeiro email será enviado automaticamente quando quotas forem atribuídas."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailHistory.map((email) => (
                <div
                  key={email.id}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{email.assunto}</span>
                        {getEmailStatusBadge(email.status_envio)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Tipo: {email.tipo_email}</p>
                        <p>Destinatário: {email.email_destino}</p>
                        <p>
                          Enviado: {new Date(email.created_at).toLocaleString('pt-BR')} 
                          <span className="ml-1">
                            ({formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: ptBR })})
                          </span>
                        </p>
                      </div>
                      {email.mensagem_erro && (
                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                          <div className="flex items-center gap-1 font-medium">
                            <XCircle className="h-3 w-3" />
                            Erro:
                          </div>
                          <p className="mt-1">{email.mensagem_erro}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            {/* Botão para enviar primeiro convite se tem quotas mas não foi enviado */}
            {selectedInvestor && !selectedInvestor.convite_enviado && (selectedInvestor.quotas_count || 0) > 0 && (
              <Button
                variant="default"
                onClick={() => selectedInvestor && handleSendInvite(selectedInvestor, false)}
                disabled={resendingInvite}
                className="gap-2"
              >
                {resendingInvite ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Convite
              </Button>
            )}
            
            {/* Botão para reenviar convite */}
            {selectedInvestor?.convite_enviado && !selectedInvestor?.primeiro_acesso && (
              <Button
                variant="outline"
                onClick={() => selectedInvestor && handleSendInvite(selectedInvestor, true)}
                disabled={resendingInvite}
                className="gap-2"
              >
                {resendingInvite ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Reenviar Convite
              </Button>
            )}
            <Button onClick={() => setEmailHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCDVInvestors;
