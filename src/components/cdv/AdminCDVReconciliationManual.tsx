import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Cog, Package, BookOpen, Recycle, AlertCircle, CheckCircle2, Loader2, Database, Play, History, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UIBStock {
  residuo: number;
  educacao: number;
  produto: number;
}

interface SaldoParcial {
  tipo: string;
  saldo_decimal: number;
}

interface Projeto {
  id: string;
  titulo: string;
}

interface Quota {
  id: string;
  numero_quota: string;
  status: string;
  id_investidor: string | null;
  cdv_investidores?: {
    razao_social: string;
  } | null;
}

interface UIBRecord {
  id: string;
  tipo: string;
  numero_sequencial: number;
  status: string;
  ids_origem: string[];
  data_geracao: string;
}

interface ImpactoBruto {
  id: string;
  tipo: string;
  valor_bruto: number;
  submaterial?: string;
  gtin?: string;
  descricao_origem?: string;
  data_hora: string;
  processado: boolean;
}

const CDV_CONFIG = {
  uib_residuos: 250,
  uib_educacao: 5,
  uib_produtos: 1,
  total_uib: 256
};

const AdminCDVReconciliationManual = () => {
  const [uibStock, setUibStock] = useState<UIBStock>({ residuo: 0, educacao: 0, produto: 0 });
  const [saldoParcial, setSaldoParcial] = useState<SaldoParcial[]>([]);
  const [impactosPendentes, setImpactosPendentes] = useState<number>(0);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [quotasPendentes, setQuotasPendentes] = useState<Quota[]>([]);
  const [selectedProjeto, setSelectedProjeto] = useState<string>("");
  const [selectedQuota, setSelectedQuota] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [runningMotor, setRunningMotor] = useState(false);
  const [runningMigration, setRunningMigration] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [traceabilityOpen, setTraceabilityOpen] = useState(false);
  const [selectedUIBs, setSelectedUIBs] = useState<UIBRecord[]>([]);
  const [selectedImpactos, setSelectedImpactos] = useState<ImpactoBruto[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProjeto) {
      fetchQuotasPendentes(selectedProjeto);
    } else {
      setQuotasPendentes([]);
      setSelectedQuota("");
    }
  }, [selectedProjeto]);

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // 🔍 Forçar nova consulta sem cache
      const timestamp = new Date().getTime();
      console.log(`[${timestamp}] 🔄 Buscando dados atualizados... ${forceRefresh ? '(FORÇA REFRESH)' : ''}`);
      
      // 🔍 DIAGNÓSTICO: Buscar dados SEM filtros para ver o total real
      const { data: allUIBs, error: allError } = await supabase
        .from('uib')
        .select('tipo, status', { count: 'exact', head: false });
      
      if (!allError && allUIBs) {
        const diagnostico = allUIBs.reduce((acc: any, uib: any) => {
          const key = `${uib.tipo}_${uib.status}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        console.log('🔍 DIAGNÓSTICO - Todas UIBs no banco:', diagnostico);
      }
      
      const [resRes, eduRes, prodRes, projRes, pendentesRes] = await Promise.all([
        supabase.from('uib').select('id', { count: 'exact', head: false }).eq('tipo', 'residuo').eq('status', 'disponivel'),
        supabase.from('uib').select('id', { count: 'exact', head: false }).eq('tipo', 'educacao').eq('status', 'disponivel'),
        supabase.from('produtos_ciclik').select('id', { count: 'exact', head: false }), // ✅ ALTERADO: Contagem direta de produtos cadastrados
        supabase.from('cdv_projetos').select('id, titulo').eq('status', 'ativo'),
        supabase.from('impacto_bruto').select('id', { count: 'exact', head: false }).eq('processado', false)
      ]);

      console.log(`[${timestamp}] 📊 Contagens obtidas:`, {
        residuo: resRes.count,
        educacao: eduRes.count,
        produto: prodRes.count,
        erros: {
          residuo: resRes.error?.message,
          educacao: eduRes.error?.message,
          produto: prodRes.error?.message
        }
      });

      // 🔧 Verificar se há erros nas queries
      if (resRes.error) console.error('Erro ao buscar UIBs Resíduo:', resRes.error);
      if (eduRes.error) console.error('Erro ao buscar UIBs Educação:', eduRes.error);
      if (prodRes.error) console.error('Erro ao buscar Produtos:', prodRes.error);

      setUibStock({
        residuo: resRes.count || 0,
        educacao: eduRes.count || 0,
        produto: prodRes.count || 0 // ✅ Total de produtos cadastrados na tabela produtos_ciclik
      });

      setProjetos(projRes.data || []);
      
      // Buscar saldo parcial separadamente com tratamento de erro
      const saldoRes = await supabase.from('saldo_parcial').select('*');
      if (saldoRes.error) {
        setSaldoParcial([]);
      } else {
        // Mapear os dados para o formato esperado, independente da estrutura
        const saldoData = (saldoRes.data || []).map((item: any) => ({
          tipo: item.tipo,
          saldo_decimal: item.saldo_decimal || item.saldo || item.valor || 0
        }));
        setSaldoParcial(saldoData);
      }
      
      setImpactosPendentes(pendentesRes.count || 0);
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotasPendentes = async (projetoId: string) => {
    try {
      const { data, error } = await supabase
        .from('cdv_quotas')
        .select(`
          id,
          numero_quota,
          status,
          id_investidor,
          cdv_investidores (
            razao_social
          )
        `)
        .eq('id_projeto', projetoId)
        .eq('status', 'em_geracao')
        .order('numero_quota', { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map(q => ({
        ...q,
        cdv_investidores: Array.isArray(q.cdv_investidores) 
          ? q.cdv_investidores[0] || null 
          : q.cdv_investidores
      })) as Quota[];
      
      setQuotasPendentes(transformedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar quotas",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const runMotorUIB = async () => {
    setRunningMotor(true);
    try {
      console.log('🚀 Iniciando Motor UIB...');
      const { data, error } = await supabase.functions.invoke('motor-uib');

      if (error) throw error;

      console.log('📊 Resultado COMPLETO do Motor UIB:', JSON.stringify(data, null, 2));
      console.log('📊 Resultados detalhados:', {
        residuo: data.resultados?.residuo,
        educacao: data.resultados?.educacao,
        produto: data.resultados?.produto,
        totais: data.totais
      });

      // 🔍 A notificação mostra quantas UIBs foram GERADAS AGORA, não o total disponível
      const uibsGeradas = data.totais?.uibs_geradas || 0;
      const impactosProcessados = data.totais?.impactos_processados || 0;
      
      console.log(`✅ Motor processou ${impactosProcessados} impactos e gerou ${uibsGeradas} UIBs`);

      toast({
        title: "✅ Motor UIB executado",
        description: `${uibsGeradas} UIBs geradas a partir de ${impactosProcessados} impactos`,
        duration: 3000,
      });

      // ⏱️ Aguardar 1.5 segundos para garantir que o banco finalizou todas as operações
      console.log('⏳ Aguardando banco finalizar operações...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('🔄 Atualizando dados do dashboard com FORCE REFRESH...');
      await fetchData(true); // 🔥 Force refresh = true para quebrar cache
      console.log('✅ Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao executar Motor UIB:', error);
      toast({
        title: "Erro ao executar Motor UIB",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setRunningMotor(false);
    }
  };

  const runHistoricalMigration = async (tipo: 'residuos' | 'educacao' | 'embalagens') => {
    setRunningMigration(tipo);
    try {
      const functionName = `processar-historico-${tipo}`;
      const { data, error } = await supabase.functions.invoke(functionName);

      if (error) throw error;

      const registrados = data.impactos_registrados || data.registrados || 0;
      toast({
        title: `✅ Migração de ${tipo} concluída`,
        description: `${registrados} impactos registrados em impacto_bruto`,
        duration: 3000,
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: `Erro na migração de ${tipo}`,
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setRunningMigration(null);
    }
  };

  const viewUIBTraceability = async (tipo: string) => {
    try {
      const { data: uibs, error: uibError } = await supabase
        .from('uib')
        .select('id, tipo, numero_sequencial, status, ids_origem, data_geracao')
        .eq('tipo', tipo)
        .eq('status', 'disponivel')
        .order('numero_sequencial', { ascending: false })
        .limit(10);

      if (uibError) throw uibError;

      setSelectedUIBs(uibs || []);

      // Buscar impactos originais das primeiras UIBs
      if (uibs && uibs.length > 0) {
        const allOrigemIds = uibs.flatMap(u => (u.ids_origem as string[]) || []).slice(0, 20);
        if (allOrigemIds.length > 0) {
          const { data: impactos } = await supabase
            .from('impacto_bruto')
            .select('id, tipo, valor_bruto, submaterial, gtin, descricao_origem, data_hora, processado')
            .in('id', allOrigemIds)
            .limit(20);
          
          setSelectedImpactos(impactos || []);
        }
      }

      setTraceabilityOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar rastreabilidade",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const canGenerateCDV = () => {
    return (
      uibStock.residuo >= CDV_CONFIG.uib_residuos &&
      uibStock.educacao >= CDV_CONFIG.uib_educacao &&
      uibStock.produto >= CDV_CONFIG.uib_produtos &&
      selectedQuota !== ""
    );
  };

  const handleGenerateCDV = async () => {
    setConfirmDialogOpen(false);
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-cdv-manual', {
        body: {
          id_quota: selectedQuota,
          id_projeto: selectedProjeto
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "🎉 CDV Gerado com Sucesso!",
        description: `${data.cdv.numero_cdv} vinculado à quota selecionada`,
        duration: 3000,
      });

      await fetchData();
      if (selectedProjeto) {
        await fetchQuotasPendentes(selectedProjeto);
      }
      setSelectedQuota("");

    } catch (error: any) {
      toast({
        title: "Erro ao gerar CDV",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStockStatus = (available: number, required: number) => {
    const percentage = (available / required) * 100;
    if (percentage >= 100) return { color: "text-green-600", bg: "bg-green-50", status: "Disponível" };
    if (percentage >= 50) return { color: "text-yellow-600", bg: "bg-yellow-50", status: "Parcial" };
    return { color: "text-red-600", bg: "bg-red-50", status: "Insuficiente" };
  };

  const getSaldoForTipo = (tipo: string) => {
    const saldo = saldoParcial.find(s => s.tipo === tipo);
    return saldo?.saldo_decimal || 0;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const resStatus = getStockStatus(uibStock.residuo, CDV_CONFIG.uib_residuos);
  const eduStatus = getStockStatus(uibStock.educacao, CDV_CONFIG.uib_educacao);
  const prodStatus = getStockStatus(uibStock.produto, CDV_CONFIG.uib_produtos);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reconciliation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reconciliation">Reconciliação</TabsTrigger>
          <TabsTrigger value="migration">Migração Histórica</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation" className="space-y-6 mt-6">
          {/* Header com Motor UIB */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Reconciliação Manual de CDV
                  </CardTitle>
                  <CardDescription>
                    Selecione um projeto e quota para atribuir UIBs e gerar o CDV manualmente
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={runMotorUIB}
                  disabled={runningMotor}
                  className="gap-2"
                >
                  {runningMotor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Cog className="w-4 h-4" />
                      Executar Motor UIB
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Estoque de UIBs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={resStatus.bg}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Recycle className="w-5 h-5 text-green-600" />
                    UIBs Resíduo
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => viewUIBTraceability('residuo')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${resStatus.color}`}>
                      {uibStock.residuo.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Necessário: {CDV_CONFIG.uib_residuos} por CDV
                    </p>
                  </div>
                  <Badge variant={uibStock.residuo >= CDV_CONFIG.uib_residuos ? "default" : "destructive"}>
                    {resStatus.status}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((uibStock.residuo / CDV_CONFIG.uib_residuos) * 100, 100)} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className={eduStatus.bg}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    UIBs Educação
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => viewUIBTraceability('educacao')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${eduStatus.color}`}>
                      {uibStock.educacao.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Necessário: {CDV_CONFIG.uib_educacao} por CDV
                    </p>
                  </div>
                  <Badge variant={uibStock.educacao >= CDV_CONFIG.uib_educacao ? "default" : "destructive"}>
                    {eduStatus.status}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((uibStock.educacao / CDV_CONFIG.uib_educacao) * 100, 100)} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className={prodStatus.bg}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    UIBs Produto
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => viewUIBTraceability('produto')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${prodStatus.color}`}>
                      {uibStock.produto.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Necessário: {CDV_CONFIG.uib_produtos} por CDV
                    </p>
                  </div>
                  <Badge variant={uibStock.produto >= CDV_CONFIG.uib_produtos ? "default" : "destructive"}>
                    {prodStatus.status}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((uibStock.produto / CDV_CONFIG.uib_produtos) * 100, 100)} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Fórmula CDV */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Fórmula do CDV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm font-mono bg-muted p-3 rounded-lg flex-wrap">
                <span className="text-green-600 font-bold">{CDV_CONFIG.uib_residuos} UIB(resíduo)</span>
                <span>+</span>
                <span className="text-blue-600 font-bold">{CDV_CONFIG.uib_educacao} UIB(educação)</span>
                <span>+</span>
                <span className="text-purple-600 font-bold">{CDV_CONFIG.uib_produtos} UIB(produto)</span>
                <span>=</span>
                <span className="text-primary font-bold">{CDV_CONFIG.total_uib} UIB = 1 CDV</span>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Projeto e Quota */}
          <Card>
            <CardHeader>
              <CardTitle>Atribuir CDV a Quota</CardTitle>
              <CardDescription>
                Selecione o projeto e a quota que receberá o CDV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Projeto</label>
                  <Select value={selectedProjeto} onValueChange={setSelectedProjeto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projetos.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quota Pendente</label>
                  <Select 
                    value={selectedQuota} 
                    onValueChange={setSelectedQuota}
                    disabled={!selectedProjeto || quotasPendentes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedProjeto 
                          ? "Selecione um projeto primeiro" 
                          : quotasPendentes.length === 0 
                            ? "Nenhuma quota pendente"
                            : "Selecione uma quota"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {quotasPendentes.map(q => (
                        <SelectItem key={q.id} value={q.id}>
                          #{q.numero_quota} - {q.cdv_investidores?.razao_social || 'Sem investidor'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!canGenerateCDV() && selectedQuota && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  UIBs insuficientes para gerar CDV
                </div>
              )}

              <Button 
                onClick={() => setConfirmDialogOpen(true)}
                disabled={!canGenerateCDV() || processing}
                className="w-full gap-2"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando CDV...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Gerar CDV e Atribuir à Quota
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Migração de Dados Históricos
              </CardTitle>
              <CardDescription>
                Processe dados históricos das tabelas legadas para impacto_bruto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-green-600" />
                      Resíduos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Entregas finalizadas → impacto_bruto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => runHistoricalMigration('residuos')}
                      disabled={runningMigration !== null}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {runningMigration === 'residuos' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      ) : (
                        <><Play className="w-4 h-4" /> Executar</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Educação
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Missões concluídas → impacto_bruto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => runHistoricalMigration('educacao')}
                      disabled={runningMigration !== null}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {runningMigration === 'educacao' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      ) : (
                        <><Play className="w-4 h-4" /> Executar</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      Embalagens
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Notas fiscais → impacto_bruto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => runHistoricalMigration('embalagens')}
                      disabled={runningMigration !== null}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {runningMigration === 'embalagens' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      ) : (
                        <><Play className="w-4 h-4" /> Executar</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Fluxo de migração:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Execute as migrações históricas para popular impacto_bruto</li>
                  <li>Execute o Motor UIB para gerar UIBs a partir dos impactos</li>
                  <li>Use a aba Reconciliação para atribuir UIBs e gerar CDVs</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Impactos Pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Impactos Pendentes
                </CardTitle>
                <CardDescription>
                  Impactos brutos aguardando processamento pelo Motor UIB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {impactosPendentes.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    impactos não processados
                  </p>
                  {impactosPendentes > 0 && (
                    <Button 
                      onClick={runMotorUIB}
                      disabled={runningMotor}
                      className="mt-4 gap-2"
                      size="sm"
                    >
                      {runningMotor ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Cog className="w-4 h-4" />
                      )}
                      Processar Agora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saldo Parcial */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Saldo Parcial
                </CardTitle>
                <CardDescription>
                  Valores decimais acumulados aguardando completar 1 UIB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm">
                      <Recycle className="w-4 h-4 text-green-600" />
                      Resíduo
                    </span>
                    <span className="font-mono text-sm">
                      {getSaldoForTipo('residuo').toFixed(3)} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Educação
                    </span>
                    <span className="font-mono text-sm">
                      {getSaldoForTipo('educacao').toFixed(3)} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-purple-600" />
                      Produto
                    </span>
                    <span className="font-mono text-sm">
                      {getSaldoForTipo('produto').toFixed(3)} un
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Geração de CDV</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reservar {CDV_CONFIG.uib_residuos} UIBs de resíduo</li>
                <li>Reservar {CDV_CONFIG.uib_educacao} UIBs de educação</li>
                <li>Reservar {CDV_CONFIG.uib_produtos} UIBs de produto</li>
                <li>Gerar um novo CDV</li>
                <li>Vincular o CDV à quota selecionada</li>
              </ul>
              <p className="mt-3 font-medium">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateCDV}>
              Confirmar e Gerar CDV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Rastreabilidade */}
      <Dialog open={traceabilityOpen} onOpenChange={setTraceabilityOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rastreabilidade UIB</DialogTitle>
            <DialogDescription>
              Visualize a composição das UIBs e seus impactos originais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">UIBs Recentes (últimas 10)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sequencial</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Impactos</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedUIBs.map(uib => (
                    <TableRow key={uib.id}>
                      <TableCell className="font-mono">#{uib.numero_sequencial}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{uib.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={uib.status === 'disponivel' ? 'default' : 'secondary'}>
                          {uib.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{(uib.ids_origem as string[])?.length || 0}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(uib.data_geracao).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Impactos Originais (amostra)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedImpactos.map(imp => (
                    <TableRow key={imp.id}>
                      <TableCell>
                        <Badge variant="outline">{imp.tipo}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {imp.valor_bruto.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {imp.submaterial || imp.gtin || imp.descricao_origem || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(imp.data_hora).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCDVReconciliationManual;
