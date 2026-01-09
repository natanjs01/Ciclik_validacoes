import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, HelpCircle, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { appUrl } from '@/lib/appUrl';

interface Quota {
  id: string;
  numero_quota: string;
  status: string;
  data_compra: string;
  data_maturacao: string;
  data_atribuicao: string | null;
  status_maturacao: string | null;
  valor_pago: number;
  kg_conciliados: number;
  horas_conciliadas: number;
  embalagens_conciliadas: number;
  meta_kg_residuos: number;
  meta_horas_educacao: number;
  meta_embalagens: number;
  id_projeto: string | null;
  id_investidor: string | null;
  cdv_investidores: {
    razao_social: string;
    cnpj: string;
  } | null;
}

interface Projeto {
  id: string;
  titulo: string;
  prazo_maturacao_meses: number;
  total_quotas: number;
  quotas: Quota[];
}

interface InvestidorGroup {
  investidor: {
    id: string;
    razao_social: string;
    cnpj: string;
  } | null;
  quotas: Quota[];
  progressoTotal: number;
  todasCompletas: boolean;
}

// Helper function to extract quota number from string (CIC-0001 -> 1)
const extractQuotaNumber = (quotaStr: string): number => {
  const match = quotaStr.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
};

// Helper to parse user input (accepts "1", "0001", "CIC-0001", etc.)
const parseQuotaInput = (input: string): string => {
  if (!input) return '';
  // If it contains letters (like CIC-0001), extract the number
  const numMatch = input.match(/\d+/);
  if (numMatch) {
    return String(parseInt(numMatch[0], 10)); // Remove leading zeros
  }
  return '';
};

const AdminCDVQuotas = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [investidores, setInvestidores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuota, setSelectedQuota] = useState<string | null>(null);
  const [selectedInvestidor, setSelectedInvestidor] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<InvestidorGroup | null>(null);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set());
  const [quotasPerPage] = useState(50);
  const [quotasPageByProject, setQuotasPageByProject] = useState<Record<string, number>>({});
  const [distributingDates, setDistributingDates] = useState(false);
  // Bulk assignment state
  const [selectedProjectForBulk, setSelectedProjectForBulk] = useState<string | null>(null);
  const [bulkQuotaStartNum, setBulkQuotaStartNum] = useState<string>("");
  const [bulkQuotaEndNum, setBulkQuotaEndNum] = useState<string>("");
  const [bulkInvestidor, setBulkInvestidor] = useState<string | null>(null);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [assigningBulk, setAssigningBulk] = useState(false);
  const [openStartCombobox, setOpenStartCombobox] = useState(false);
  const [openEndCombobox, setOpenEndCombobox] = useState(false);
  const { toast } = useToast();

  // Get available quotas list for the selected project
  const availableQuotasList = useMemo(() => {
    if (!selectedProjectForBulk) return [];
    const projeto = projetos.find(p => p.id === selectedProjectForBulk);
    if (!projeto) return [];
    return projeto.quotas
      .filter(q => !q.id_investidor)
      .map(q => ({
        id: q.id,
        numero_quota: q.numero_quota,
        num: extractQuotaNumber(q.numero_quota)
      }))
      .sort((a, b) => a.num - b.num);
  }, [selectedProjectForBulk, projetos]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar investidores
      const { data: investidoresData, error: investidoresError } = await supabase
        .from("cdv_investidores")
        .select("*")
        .order("razao_social");

      if (investidoresError) throw investidoresError;
      setInvestidores(investidoresData || []);

      // Buscar projetos com suas quotas
      const { data: projetosData, error: projetosError } = await supabase
        .from("cdv_projetos")
        .select("id, titulo, prazo_maturacao_meses, total_quotas")
        .order("created_at", { ascending: false });

      if (projetosError) throw projetosError;

      // Para cada projeto, buscar TODAS as quotas usando paginação
      const projetosComQuotas = await Promise.all(
        (projetosData || []).map(async (projeto) => {
          // Buscar quotas em blocos de 1000 para garantir que todas sejam carregadas
          let allQuotas: any[] = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;
          
          while (hasMore) {
            const { data: quotasData, error: quotasError } = await supabase
              .from("cdv_quotas")
              .select(`
                *,
                cdv_investidores (
                  razao_social,
                  cnpj
                )
              `)
              .eq("id_projeto", projeto.id)
              .order("numero_quota")
              .range(from, from + pageSize - 1);

            if (quotasError) {
              throw quotasError;
            }
            
            if (quotasData && quotasData.length > 0) {
              allQuotas = [...allQuotas, ...quotasData];
              from += pageSize;
              hasMore = quotasData.length === pageSize;
            } else {
              hasMore = false;
            }
          }
          
          console.log(`Projeto ${projeto.titulo}: ${allQuotas.length} quotas carregadas`);
          
          return {
            ...projeto,
            quotas: allQuotas,
          };
        })
      );
      
      setProjetos(projetosComQuotas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (quota: Quota) => {
    // Usar metas da nova fórmula (250 kg, 5 min, 1 produto = 256 UIBs)
    const metaKg = quota.meta_kg_residuos || 250;
    const metaHoras = quota.meta_horas_educacao || 5;
    const metaEmbalagens = quota.meta_embalagens || 1;
    
    const progressKg = Math.min((quota.kg_conciliados / metaKg) * 100, 100);
    const progressHoras = Math.min((quota.horas_conciliadas / metaHoras) * 100, 100);
    const progressEmbalagens = Math.min((quota.embalagens_conciliadas / metaEmbalagens) * 100, 100);
    
    return Math.min((progressKg + progressHoras + progressEmbalagens) / 3, 100);
  };

  const getBlockLabel = (quota: Quota, projeto: Projeto) => {
    if (!quota.data_maturacao || !projeto.prazo_maturacao_meses) return 'N/A';
    
    // Calcular número de blocos
    const nBlocos = Math.ceil(projeto.prazo_maturacao_meses / 12);
    
    // Calcular quotas por bloco
    const quotasPorBloco = Math.ceil(projeto.total_quotas / nBlocos);
    
    // Extrair número da quota (assumindo formato CIC-0001)
    const numeroQuota = parseInt(quota.numero_quota.split('-')[1]);
    
    // Calcular qual bloco pertence
    const bloco = Math.ceil(numeroQuota / quotasPorBloco);
    
    return `${bloco}º Ano`;
  };

  const formatMaturityDate = (date: string | null) => {
    if (!date) return 'Não definido';
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      em_geracao: { label: "Em Geração", variant: "secondary" },
      pronto: { label: "Pronto", variant: "default" },
      certificado_emitido: { label: "Certificado Emitido", variant: "default" },
    };

    const variant = variants[status] || variants.em_geracao;
    return <Badge variant={variant.variant}>{variant.label}</Badge>;
  };

  const getMaturacaoIndicator = (quota: Quota) => {
    if (!quota.status_maturacao) {
      return <Badge variant="secondary">Não atribuída</Badge>;
    }

    const statusMap: Record<string, { icon: any; label: string; variant: "default" | "secondary" | "destructive" }> = {
      no_prazo: { icon: CheckCircle, label: "No Prazo", variant: "default" },
      em_maturacao: { icon: Clock, label: "Em Maturação", variant: "secondary" },
      atrasada: { icon: AlertTriangle, label: "Atrasada", variant: "destructive" },
    };

    const status = statusMap[quota.status_maturacao] || statusMap.no_prazo;
    const Icon = status.icon;

    return (
      <Badge variant={status.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.label}
      </Badge>
    );
  };

  const groupQuotasByInvestidor = (quotas: Quota[]): InvestidorGroup[] => {
    const groups = new Map<string, InvestidorGroup>();

    // Grupo de quotas disponíveis (sem investidor)
    const quotasDisponiveis = quotas.filter((q) => !q.id_investidor);
    if (quotasDisponiveis.length > 0) {
      groups.set("disponivel", {
        investidor: null,
        quotas: quotasDisponiveis,
        progressoTotal: 0,
        todasCompletas: false,
      });
    }

    // Agrupar por investidor
    quotas
      .filter((q) => q.id_investidor)
      .forEach((quota) => {
        const key = quota.id_investidor!;
        if (!groups.has(key)) {
          groups.set(key, {
            investidor: quota.cdv_investidores
              ? {
                  id: quota.id_investidor!,
                  razao_social: quota.cdv_investidores.razao_social,
                  cnpj: quota.cdv_investidores.cnpj,
                }
              : null,
            quotas: [],
            progressoTotal: 0,
            todasCompletas: false,
          });
        }
        groups.get(key)!.quotas.push(quota);
      });

    // Calcular progresso e verificar completude de cada grupo
    groups.forEach((group) => {
      if (group.investidor) {
        const progressos = group.quotas.map(calculateProgress);
        group.progressoTotal = progressos.reduce((sum, p) => sum + p, 0) / progressos.length;
        group.todasCompletas = group.quotas.every((q) => calculateProgress(q) >= 100);
      }
    });

    return Array.from(groups.values());
  };

  const enviarConviteInvestidor = async (investidorId: string) => {
    try {
      // Buscar dados do investidor
      const { data: investidor, error: invError } = await supabase
        .from("cdv_investidores")
        .select("*")
        .eq("id", investidorId)
        .single();

      if (invError || !investidor) {
        console.error("Investidor não encontrado:", invError);
        return;
      }

      // Verificar se já recebeu convite
      if (investidor.convite_enviado) {
        console.log("Investidor já recebeu convite anteriormente");
        return;
      }

      console.log("Criando usuário auth para investidor:", investidor.email);

      // Criar usuário auth com senha temporária
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: investidor.email,
        password: tempPassword,
        options: {
          data: {
            nome: investidor.nome_responsavel,
            tipo_pessoa: 'PJ',
            cnpj: investidor.cnpj,
            cep: '00000-000',
            role: 'investidor'
          },
          emailRedirectTo: appUrl('/cdv/investor')
        }
      });

      if (authError) {
        console.error("Erro ao criar usuário auth:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário");
      }

      console.log("Usuário auth criado:", authData.user.id);

      // Aguardar o trigger handle_new_user criar o profile e role
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Confirmar email automaticamente para usuários criados pelo admin
      // Isso evita o envio do email de confirmação (já será enviado o de redefinição de senha)
      try {
        await supabase.rpc('confirmar_email_usuario', {
          usuario_id: authData.user.id
        });
      } catch (rpcError) {
        console.error('Erro ao confirmar email automaticamente:', rpcError);
        // Continua mesmo se falhar (o usuário ainda pode confirmar manualmente)
      }

      // Atualizar id_user do investidor com o novo usuário
      await supabase
        .from("cdv_investidores")
        .update({ id_user: authData.user.id })
        .eq("id", investidorId);

      // Atribuir role 'investidor'
      await supabase
        .from("user_roles")
        .upsert({
          user_id: authData.user.id,
          role: 'investidor'
        }, { onConflict: 'user_id' });

      // Gerar link de reset de senha
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        investidor.email,
  { redirectTo: appUrl('/reset-password') }
      );

      if (resetError) {
        console.error("Erro ao gerar link de reset:", resetError);
      }

      // Enviar email de convite via edge function
      const { error: emailError } = await supabase.functions.invoke("enviar-convite-investidor", {
        body: {
          email: investidor.email,
          razaoSocial: investidor.razao_social,
          nomeResponsavel: investidor.nome_responsavel,
          resetLink: appUrl('/reset-password'),
          idInvestidor: investidorId
        }
      });

      if (emailError) {
        console.error("Erro ao enviar email de convite:", emailError);
        throw emailError;
      }

      toast({
        title: "Convite enviado",
        description: `Email de acesso enviado para ${investidor.email}`,
      });

    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast({
        title: "Aviso",
        description: "Quotas atribuídas, mas houve um problema ao enviar o email de convite.",
        variant: "destructive",
      });
    }
  };

  const handleAtribuirInvestidor = async () => {
    if (!selectedQuota || !selectedInvestidor) return;

    try {
      const projeto = projetos.find((p) => p.quotas.some((q) => q.id === selectedQuota));
      if (!projeto) return;

      // Verificar se é a primeira quota do investidor
      const investidorInfo = investidores.find(i => i.id === selectedInvestidor);
      const isFirstQuota = !investidorInfo?.convite_enviado;

      const dataAtribuicao = new Date();
      const dataMaturacao = new Date(dataAtribuicao);
      dataMaturacao.setMonth(dataMaturacao.getMonth() + projeto.prazo_maturacao_meses);

      const { error } = await supabase
        .from("cdv_quotas")
        .update({
          id_investidor: selectedInvestidor,
          data_atribuicao: dataAtribuicao.toISOString(),
          data_maturacao: dataMaturacao.toISOString(),
          status_maturacao: "no_prazo",
        })
        .eq("id", selectedQuota);

      if (error) throw error;

      // Se for primeira quota, enviar convite automaticamente
      if (isFirstQuota) {
        await enviarConviteInvestidor(selectedInvestidor);
      }

      toast({
        title: "Investidor atribuído",
        description: isFirstQuota 
          ? "Quota atribuída e convite de acesso enviado ao investidor."
          : "Quota atribuída com sucesso ao investidor.",
      });

      setShowAssignDialog(false);
      setSelectedQuota(null);
      setSelectedInvestidor(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir investidor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAvailableQuotasForProject = (projectId: string) => {
    const projeto = projetos.find(p => p.id === projectId);
    if (!projeto) return [];
    return projeto.quotas.filter(q => !q.id_investidor).sort((a, b) => a.numero_quota.localeCompare(b.numero_quota));
  };


  const getQuotasInRange = (): Quota[] => {
    if (!selectedProjectForBulk || !bulkQuotaStartNum || !bulkQuotaEndNum) return [];
    
    const startNum = parseInt(bulkQuotaStartNum, 10);
    const endNum = parseInt(bulkQuotaEndNum, 10);
    
    if (isNaN(startNum) || isNaN(endNum) || startNum <= 0 || endNum <= 0) return [];
    
    const [fromNum, toNum] = startNum <= endNum ? [startNum, endNum] : [endNum, startNum];
    
    const projeto = projetos.find(p => p.id === selectedProjectForBulk);
    if (!projeto) return [];
    
    // Filtrar quotas sem investidor cujo número está no range
    return projeto.quotas.filter(q => {
      if (q.id_investidor) return false; // Já atribuída
      const qNum = extractQuotaNumber(q.numero_quota);
      return qNum >= fromNum && qNum <= toNum;
    }).sort((a, b) => extractQuotaNumber(a.numero_quota) - extractQuotaNumber(b.numero_quota));
  };

  const getBulkAssignmentInfo = () => {
    if (!selectedProjectForBulk) return { total: 0, available: 0, inRange: 0 };
    
    const projeto = projetos.find(p => p.id === selectedProjectForBulk);
    if (!projeto) return { total: 0, available: 0, inRange: 0 };
    
    const available = projeto.quotas.filter(q => !q.id_investidor).length;
    const inRange = getQuotasInRange().length;
    
    return { total: projeto.total_quotas || 0, available, inRange };
  };

  const handleBulkAtribuirInvestidor = async () => {
    if (!bulkInvestidor || !selectedProjectForBulk) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o projeto e o investidor.",
        variant: "destructive",
      });
      return;
    }
    
    const quotasToAssign = getQuotasInRange();
    if (quotasToAssign.length === 0) {
      toast({
        title: "Nenhuma quota no range",
        description: "O range especificado não contém quotas disponíveis para atribuição.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigningBulk(true);
      const projeto = projetos.find(p => p.id === selectedProjectForBulk);
      if (!projeto) {
        throw new Error("Projeto não encontrado");
      }

      // Verificar se é a primeira quota do investidor
      const investidorInfo = investidores.find(i => i.id === bulkInvestidor);
      const isFirstQuota = !investidorInfo?.convite_enviado;

      const dataAtribuicao = new Date();
      const dataMaturacao = new Date(dataAtribuicao);
      dataMaturacao.setMonth(dataMaturacao.getMonth() + (projeto.prazo_maturacao_meses || 12));

      const quotaIds = quotasToAssign.map(q => q.id);

      console.log(`Atribuindo ${quotaIds.length} quotas ao investidor ${bulkInvestidor}`);

      const { error } = await supabase
        .from("cdv_quotas")
        .update({
          id_investidor: bulkInvestidor,
          data_atribuicao: dataAtribuicao.toISOString(),
          data_maturacao: dataMaturacao.toISOString(),
          status_maturacao: "no_prazo",
        })
        .in("id", quotaIds);

      if (error) throw error;

      // Se for primeira quota, enviar convite automaticamente
      if (isFirstQuota) {
        await enviarConviteInvestidor(bulkInvestidor);
      }

      toast({
        title: "Quotas atribuídas com sucesso!",
        description: isFirstQuota
          ? `${quotasToAssign.length} quota(s) atribuída(s) e convite enviado ao investidor.`
          : `${quotasToAssign.length} quota(s) atribuída(s) ao investidor.`,
      });

      setShowBulkAssignDialog(false);
      setSelectedProjectForBulk(null);
      setBulkQuotaStartNum("");
      setBulkQuotaEndNum("");
      setBulkInvestidor(null);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao atribuir quotas:", error);
      toast({
        title: "Erro ao atribuir investidor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigningBulk(false);
    }
  };

  const handleEmitirCertificado = async () => {
    if (!selectedGroup || !selectedGroup.investidor) return;

    try {
      const quotasIds = selectedGroup.quotas.map((q) => q.id);
      const projeto = projetos.find((p) => p.quotas.some((q) => quotasIds.includes(q.id)));
      if (!projeto) return;

      // Somar impactos
      const totalKg = selectedGroup.quotas.reduce((sum, q) => sum + q.kg_conciliados, 0);
      const totalHoras = selectedGroup.quotas.reduce((sum, q) => sum + q.horas_conciliadas, 0);
      const totalEmbalagens = selectedGroup.quotas.reduce((sum, q) => sum + q.embalagens_conciliadas, 0);

      // Gerar número de certificado
      const numeroCertificado = `CDV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const hashValidacao = Math.random().toString(36).substr(2, 16).toUpperCase();

      const { error: certError } = await supabase.from("cdv_certificados").insert({
        id_projeto: projeto.id,
        id_investidor: selectedGroup.investidor.id,
        quotas_incluidas: quotasIds,
        total_quotas: quotasIds.length,
        numero_certificado: numeroCertificado,
        hash_validacao: hashValidacao,
        cnpj: selectedGroup.investidor.cnpj,
        razao_social: selectedGroup.investidor.razao_social,
        kg_certificados: totalKg,
        horas_certificadas: totalHoras,
        embalagens_certificadas: totalEmbalagens,
        periodo_inicio: selectedGroup.quotas[0].data_compra,
        periodo_fim: selectedGroup.quotas[0].data_maturacao,
      });

      if (certError) throw certError;

      // Atualizar status das quotas
      const { error: updateError } = await supabase
        .from("cdv_quotas")
        .update({ status: "certificado_emitido" })
        .in("id", quotasIds);

      if (updateError) throw updateError;

      toast({
        title: "Certificado emitido",
        description: `Certificado ${numeroCertificado} emitido com sucesso para ${selectedGroup.quotas.length} quota(s).`,
      });

      setShowCertificateDialog(false);
      setSelectedGroup(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao emitir certificado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleProject = (projectId: string) => {
    setOpenProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
        // Inicializar página para este projeto
        if (!quotasPageByProject[projectId]) {
          setQuotasPageByProject(prev => ({ ...prev, [projectId]: 1 }));
        }
      }
      return newSet;
    });
  };

  const loadMoreQuotas = (projectId: string) => {
    setQuotasPageByProject(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || 1) + 1
    }));
  };

  const handleDistribuirDatas = async (projectId: string) => {
    try {
      setDistributingDates(true);
      
      const { data, error } = await supabase.rpc('distribuir_datas_maturacao_quotas', {
        p_id_projeto: projectId
      });

      if (error) throw error;

      toast({
        title: "Datas distribuídas",
        description: `${data} quotas tiveram suas datas de maturação distribuídas automaticamente.`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao distribuir datas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDistributingDates(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotas CDV por Projeto</h2>
          <p className="text-muted-foreground">Gestão de quotas agrupadas por projeto e investidor</p>
        </div>
      </div>

      {/* Card de Atribuição em Lote */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Atribuição em Lote
          </CardTitle>
          <CardDescription>
            Digite o range de números de quota (ex: 1 até 100) para atribuir ao investidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Projeto</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Selecione o projeto CDV que contém as quotas a serem atribuídas. Apenas projetos com quotas disponíveis são mostrados.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={selectedProjectForBulk || ""} 
                onValueChange={(v) => {
                  setSelectedProjectForBulk(v);
                  setBulkQuotaStartNum("");
                  setBulkQuotaEndNum("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map((p) => {
                    const disponiveis = p.quotas.filter(q => !q.id_investidor).length;
                    return (
                      <SelectItem key={p.id} value={p.id} disabled={disponiveis === 0}>
                        {p.titulo} ({disponiveis} disponíveis)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Quota Inicial (nº)</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Digite ou selecione a primeira quota do range a ser atribuído.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Popover open={openStartCombobox} onOpenChange={setOpenStartCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStartCombobox}
                    disabled={!selectedProjectForBulk}
                    className="w-full justify-between font-normal"
                  >
                    {bulkQuotaStartNum ? (
                      <span>
                        {availableQuotasList.find(q => String(q.num) === bulkQuotaStartNum)?.numero_quota || `Nº ${bulkQuotaStartNum}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Ex: 1 ou CIC-0001</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Digite nº ou código (ex: CIC-0001)..." 
                      onValueChange={(value) => {
                        const parsed = parseQuotaInput(value);
                        if (parsed || value === '') {
                          setBulkQuotaStartNum(parsed);
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {bulkQuotaStartNum ? (
                          <div 
                            className="w-full p-2 text-sm text-left hover:bg-accent rounded cursor-pointer"
                            onClick={() => {
                              setOpenStartCombobox(false);
                            }}
                          >
                            Usar: <span className="font-medium">Quota nº {bulkQuotaStartNum}</span>
                          </div>
                        ) : (
                          "Digite um número ou código de quota"
                        )}
                      </CommandEmpty>
                      <CommandGroup heading={`Quotas disponíveis (${availableQuotasList.length})`}>
                        {availableQuotasList
                          .filter(q => !bulkQuotaStartNum || String(q.num).includes(bulkQuotaStartNum) || q.numero_quota.toLowerCase().includes(bulkQuotaStartNum.toLowerCase()))
                          .map((quota) => (
                          <CommandItem
                            key={quota.id}
                            value={quota.numero_quota}
                            onSelect={() => {
                              setBulkQuotaStartNum(String(quota.num));
                              setOpenStartCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                bulkQuotaStartNum === String(quota.num) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {quota.numero_quota} (nº {quota.num})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Quota Final (nº)</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Digite ou selecione a última quota do range. Todas as quotas disponíveis entre a inicial e final serão atribuídas.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Popover open={openEndCombobox} onOpenChange={setOpenEndCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEndCombobox}
                    disabled={!selectedProjectForBulk}
                    className="w-full justify-between font-normal"
                  >
                    {bulkQuotaEndNum ? (
                      <span>
                        {availableQuotasList.find(q => String(q.num) === bulkQuotaEndNum)?.numero_quota || `Nº ${bulkQuotaEndNum}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Ex: 100 ou CIC-0100</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Digite nº ou código (ex: CIC-0100)..." 
                      onValueChange={(value) => {
                        const parsed = parseQuotaInput(value);
                        if (parsed || value === '') {
                          setBulkQuotaEndNum(parsed);
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {bulkQuotaEndNum ? (
                          <div 
                            className="w-full p-2 text-sm text-left hover:bg-accent rounded cursor-pointer"
                            onClick={() => {
                              setOpenEndCombobox(false);
                            }}
                          >
                            Usar: <span className="font-medium">Quota nº {bulkQuotaEndNum}</span>
                          </div>
                        ) : (
                          "Digite um número ou código de quota"
                        )}
                      </CommandEmpty>
                      <CommandGroup heading={`Quotas disponíveis (${availableQuotasList.length})`}>
                        {availableQuotasList
                          .filter(q => !bulkQuotaEndNum || String(q.num).includes(bulkQuotaEndNum) || q.numero_quota.toLowerCase().includes(bulkQuotaEndNum.toLowerCase()))
                          .map((quota) => (
                          <CommandItem
                            key={quota.id}
                            value={quota.numero_quota}
                            onSelect={() => {
                              setBulkQuotaEndNum(String(quota.num));
                              setOpenEndCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                bulkQuotaEndNum === String(quota.num) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {quota.numero_quota} (nº {quota.num})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Investidor</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Investidor que receberá as quotas. Se for a primeira atribuição deste investidor, um convite de acesso será enviado automaticamente.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={bulkInvestidor || ""} 
                onValueChange={setBulkInvestidor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o investidor" />
                </SelectTrigger>
                <SelectContent>
                  {investidores.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setShowBulkAssignDialog(true)}
                  disabled={!bulkQuotaStartNum || !bulkQuotaEndNum || !bulkInvestidor || !selectedProjectForBulk || assigningBulk}
                  className="w-full"
                >
                  {assigningBulk ? "Atribuindo..." : `Atribuir ${getQuotasInRange().length > 0 ? `${getQuotasInRange().length} quota(s)` : ''}`}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>Confirme e atribua todas as quotas do range selecionado ao investidor. As quotas já atribuídas serão ignoradas.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {selectedProjectForBulk && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <div className="flex gap-6">
                <span>Total de quotas: <strong>{getBulkAssignmentInfo().total}</strong></span>
                <span>Disponíveis: <strong className="text-primary">{getBulkAssignmentInfo().available}</strong></span>
                {getQuotasInRange().length > 0 && (
                  <span>No range selecionado: <strong className="text-green-600">{getBulkAssignmentInfo().inRange}</strong></span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {projetos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum projeto com quotas encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projetos.map((projeto) => {
          const currentPage = quotasPageByProject[projeto.id] || 1;
          const displayedQuotas = projeto.quotas.slice(0, currentPage * quotasPerPage);
          const groups = groupQuotasByInvestidor(displayedQuotas);
          const isOpen = openProjects.has(projeto.id);
          const totalQuotas = projeto.total_quotas || 0;
          const quotasAtribuidas = projeto.quotas.filter((q) => q.id_investidor).length;
          const quotasDisponiveis = totalQuotas - quotasAtribuidas;
          const hasMoreQuotas = displayedQuotas.length < projeto.quotas.length;

          return (
            <Card key={projeto.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggleProject(projeto.id)}>
                <CardHeader className="p-0">
                  <CollapsibleTrigger className="w-full">
                    <div className="cursor-pointer hover:bg-accent/50 transition-colors p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Award className="h-6 w-6 text-primary" />
                          <div className="text-left">
                            <CardTitle>{projeto.titulo}</CardTitle>
                            <CardDescription>
                              {totalQuotas} quotas totais • {quotasAtribuidas} atribuídas • {quotasDisponiveis}{" "}
                              disponíveis
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">Prazo: {projeto.prazo_maturacao_meses || 12} meses</Badge>
                          <TrendingUp className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  {!isOpen && (
                    <div className="px-6 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDistribuirDatas(projeto.id);
                        }}
                        disabled={distributingDates}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Distribuir Datas de Maturação
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Tabela completa de quotas */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium">Quota</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Bloco</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Vencimento</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Investidor</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Maturação</th>
                              <th className="px-4 py-3 text-right text-sm font-medium">Progresso</th>
                              <th className="px-4 py-3 text-right text-sm font-medium">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {displayedQuotas.map((quota) => {
                              const progress = calculateProgress(quota);
                              const investidor = quota.cdv_investidores;

                              return (
                                <tr key={quota.id} className="hover:bg-muted/50">
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="font-mono">
                                      {quota.numero_quota}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="secondary">
                                      {getBlockLabel(quota, projeto)}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {formatMaturityDate(quota.data_maturacao)}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {investidor ? (
                                      <div>
                                        <p className="font-medium">{investidor.razao_social}</p>
                                        <p className="text-xs text-muted-foreground">{investidor.cnpj}</p>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Disponível</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {getStatusBadge(quota.status)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {getMaturacaoIndicator(quota)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <Progress value={progress} className="w-24 h-2" />
                                      <span className="text-sm font-medium w-12 text-right">
                                        {progress.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-medium">
                                    {formatCurrency(quota.valor_pago)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Botão para carregar mais quotas */}
                    {hasMoreQuotas && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => loadMoreQuotas(projeto.id)}
                        >
                          Carregar mais quotas ({displayedQuotas.length} de {projeto.quotas.length})
                        </Button>
                      </div>
                    )}

                    {/* Seção de gestão por investidor */}
                    <div className="space-y-4 mt-6">
                      {groups.map((group, idx) => {
                        if (!group.investidor) return null;

                        return (
                          <div key={idx} className="border rounded-lg p-4 space-y-4">
                            {/* Cabeçalho do grupo */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{group.investidor.razao_social}</h3>
                                <p className="text-sm text-muted-foreground">
                                  CNPJ: {group.investidor.cnpj} • {group.quotas.length} quota{group.quotas.length !== 1 ? 's' : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Progresso Total</p>
                                  <p className="text-xl font-bold">{group.progressoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</p>
                                </div>
                                {group.todasCompletas && (
                                  <Button
                                    onClick={() => {
                                      setSelectedGroup(group);
                                      setShowCertificateDialog(true);
                                    }}
                                    className="gap-2"
                                  >
                                    <Award className="h-4 w-4" />
                                    Emitir Certificado
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
        </div>
      )}

      {/* Dialog de confirmação de atribuição */}
      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir Investidor à Quota</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma a atribuição desta quota ao investidor selecionado? A data de maturação será calculada
              automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAtribuirInvestidor}>Confirmar Atribuição</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de certificado */}
      <AlertDialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emitir Certificado Consolidado</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGroup && (
                <>
                  Será emitido um certificado consolidado para <strong>{selectedGroup.investidor?.razao_social}</strong>{" "}
                  incluindo <strong>{selectedGroup.quotas.length}</strong> quota(s) com todos os impactos ambientais
                  devidamente reconciliados e auditados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmitirCertificado}>Emitir Certificado</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de atribuição em lote */}
      <AlertDialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir Quotas em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const quotas = getQuotasInRange();
                const investidor = investidores.find(i => i.id === bulkInvestidor);
                if (quotas.length === 0 || !investidor) return null;
                return (
                  <>
                    Confirma a atribuição de <strong>{quotas.length} quota(s)</strong> (de {quotas[0].numero_quota} até {quotas[quotas.length - 1].numero_quota}) 
                    ao investidor <strong>{investidor.razao_social}</strong>? A data de maturação será calculada automaticamente.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={assigningBulk}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAtribuirInvestidor} disabled={assigningBulk}>
              {assigningBulk ? 'Atribuindo...' : 'Confirmar Atribuição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCDVQuotas;
