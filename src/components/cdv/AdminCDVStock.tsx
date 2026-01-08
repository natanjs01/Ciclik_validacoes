import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Leaf, GraduationCap, Package, Database, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercentage } from "@/lib/formatters";

interface StockStats {
  residuos_disponiveis: number;
  residuos_atribuidos: number;
  educacao_disponivel: number;
  educacao_atribuida: number;
  embalagens_disponiveis: number;
  embalagens_atribuidas: number;
}

interface ResiduoDetalhado {
  id: string;
  data_entrega: string;
  submaterial: string;
  kg: number;
  status: string;
  id_cdv: string | null;
  cooperativas: { nome_fantasia: string } | null;
  cdv_quotas: { numero_quota: string; cdv_projetos: { titulo: string } | null } | null;
}

interface EducacaoDetalhada {
  id: string;
  data: string;
  modulo: string;
  minutos_assistidos: number;
  status: string;
  id_cdv: string | null;
  profiles: { nome: string } | null;
  cdv_quotas: { numero_quota: string; cdv_projetos: { titulo: string } | null } | null;
}

interface EmbalagemDetalhada {
  id: string;
  data: string;
  gtin: string;
  nome_produto: string;
  tipo_embalagem: string | null;
  reciclabilidade: number | null;
  status: string;
  id_cdv: string | null;
  cdv_quotas: { numero_quota: string; cdv_projetos: { titulo: string } | null } | null;
}

interface AdminCDVStockProps {
  onNavigateToReconciliation?: () => void;
}

const AdminCDVStock = ({ onNavigateToReconciliation }: AdminCDVStockProps) => {
  const [stats, setStats] = useState<StockStats>({
    residuos_disponiveis: 0,
    residuos_atribuidos: 0,
    educacao_disponivel: 0,
    educacao_atribuida: 0,
    embalagens_disponiveis: 0,
    embalagens_atribuidas: 0
  });
  const [residuosDetalhados, setResiduosDetalhados] = useState<ResiduoDetalhado[]>([]);
  const [educacaoDetalhada, setEducacaoDetalhada] = useState<EducacaoDetalhada[]>([]);
  const [embalagensDetalhadas, setEmbalagensDetalhadas] = useState<EmbalagemDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoHistorico, setProcessandoHistorico] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStockStats();
  }, []);

  const fetchStockStats = async () => {
    try {
      // Fetch residuos stats
      const { data: residuosDisp } = await supabase
        .from("estoque_residuos")
        .select("kg")
        .eq("status", "disponivel");
      
      const { data: residuosAtrib } = await supabase
        .from("estoque_residuos")
        .select("kg")
        .eq("status", "atribuido");

      // Fetch educacao stats
      const { data: educDisp } = await supabase
        .from("estoque_educacao")
        .select("minutos_assistidos")
        .eq("status", "disponivel");
      
      const { data: educAtrib } = await supabase
        .from("estoque_educacao")
        .select("minutos_assistidos")
        .eq("status", "atribuido");

      // Fetch embalagens stats
      const { data: embDisp } = await supabase
        .from("estoque_embalagens")
        .select("*")
        .eq("status", "disponivel");
      
      const { data: embAtrib } = await supabase
        .from("estoque_embalagens")
        .select("*")
        .eq("status", "atribuido");

      // Fetch detailed records with CDV and project info
      const { data: residuosDetail } = await supabase
        .from("estoque_residuos")
        .select("*, cooperativas(nome_fantasia), cdv_quotas(numero_quota, cdv_projetos(titulo))")
        .order("data_entrega", { ascending: false })
        .limit(100);

      const { data: educacaoDetail } = await supabase
        .from("estoque_educacao")
        .select("*, profiles(nome), cdv_quotas(numero_quota, cdv_projetos(titulo))")
        .order("data", { ascending: false })
        .limit(100);

      const { data: embalagensDetail } = await supabase
        .from("estoque_embalagens")
        .select("*, cdv_quotas(numero_quota, cdv_projetos(titulo))")
        .order("data", { ascending: false })
        .limit(100);

      setStats({
        residuos_disponiveis: residuosDisp?.reduce((sum, r) => sum + Number(r.kg), 0) || 0,
        residuos_atribuidos: residuosAtrib?.reduce((sum, r) => sum + Number(r.kg), 0) || 0,
        educacao_disponivel: educDisp?.reduce((sum, e) => sum + Number(e.minutos_assistidos), 0) / 60 || 0,
        educacao_atribuida: educAtrib?.reduce((sum, e) => sum + Number(e.minutos_assistidos), 0) / 60 || 0,
        embalagens_disponiveis: embDisp?.length || 0,
        embalagens_atribuidas: embAtrib?.length || 0
      });

      setResiduosDetalhados(residuosDetail as ResiduoDetalhado[] || []);
      setEducacaoDetalhada(educacaoDetail as EducacaoDetalhada[] || []);
      setEmbalagensDetalhadas(embalagensDetail as EmbalagemDetalhada[] || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const processarHistoricoCompleto = async () => {
    setProcessandoHistorico(true);
    
    try {
      toast({
        title: "Processando histórico...",
        description: "Isso pode levar alguns minutos. Aguarde.",
      });

      // Processar resíduos
      const { data: residuosData, error: residuosError } = await supabase.functions.invoke(
        'processar-historico-residuos',
        { body: {} }
      );

      if (residuosError) throw residuosError;

      // Processar educação
      const { data: educacaoData, error: educacaoError } = await supabase.functions.invoke(
        'processar-historico-educacao',
        { body: {} }
      );

      if (educacaoError) throw educacaoError;

      // Processar embalagens
      const { data: embalagensData, error: embalagensError } = await supabase.functions.invoke(
        'processar-historico-embalagens',
        { body: {} }
      );

      if (embalagensError) throw embalagensError;

      toast({
        title: "Processamento concluído!",
        description: `
          Resíduos: ${residuosData.residuos_registrados || 0} registrados
          Educação: ${educacaoData.registradas || 0} registradas
          Embalagens: ${embalagensData.embalagens_registradas || 0} registradas
        `,
      });

      // Recarregar dados
      await fetchStockStats();
      
    } catch (error: any) {
      console.error('Erro ao processar histórico:', error);
      toast({
        title: "Erro no processamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessandoHistorico(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Totals Highlight */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Leaf className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-xs">Resíduos Coletados</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">
              {formatNumber(stats.residuos_disponiveis + stats.residuos_atribuidos)} kg
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Disponível</p>
                <p className="font-semibold">{formatNumber(stats.residuos_disponiveis)} kg</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atribuído</p>
                <p className="font-semibold">{formatNumber(stats.residuos_atribuidos)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <GraduationCap className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-xs">Educação Ambiental</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">
              {formatNumber(stats.educacao_disponivel + stats.educacao_atribuida, 1)} h
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Disponível</p>
                <p className="font-semibold">{formatNumber(stats.educacao_disponivel, 1)} h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atribuído</p>
                <p className="font-semibold">{formatNumber(stats.educacao_atribuida, 1)} h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Package className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-xs">Embalagens Catalogadas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.embalagens_disponiveis + stats.embalagens_atribuidas}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Disponível</p>
                <p className="font-semibold">{stats.embalagens_disponiveis}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Atribuído</p>
                <p className="font-semibold">{stats.embalagens_atribuidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stock Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Estoque Detalhado de Impactos CDV
              </CardTitle>
              <CardDescription>
                Visualização consolidada dos impactos acumulados no sistema
              </CardDescription>
            </div>
            <Button 
              onClick={processarHistoricoCompleto}
              disabled={processandoHistorico}
              variant="outline"
              size="sm"
            >
              {processandoHistorico ? "Processando..." : "🔄 Processar Histórico"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* How it Works */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-primary">💡</span>
                Como Funciona o Estoque de Impactos
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Resíduos:</strong> Gerados automaticamente quando cooperativas finalizam entregas validadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Educação:</strong> Registrada quando usuários completam missões educacionais (vídeos + quiz)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Embalagens:</strong> Catalogadas quando produtos com GTIN são cadastrados via notas fiscais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Status Disponível:</strong> Impactos prontos para serem atribuídos a quotas CDV</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Status Atribuído:</strong> Impactos já reconciliados com quotas CDV específicas</span>
                </li>
              </ul>
            </div>

            {/* Stock Availability Percentages */}
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg bg-card">
                <Leaf className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">
                  {formatPercentage((stats.residuos_disponiveis / (stats.residuos_disponiveis + stats.residuos_atribuidos || 1)) * 100, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Resíduos Disponíveis</p>
                <p className="text-xs text-muted-foreground mt-1">para atribuição</p>
              </div>

              <div className="p-4 border rounded-lg bg-card">
                <GraduationCap className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">
                  {formatPercentage((stats.educacao_disponivel / (stats.educacao_disponivel + stats.educacao_atribuida || 1)) * 100, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Educação Disponível</p>
                <p className="text-xs text-muted-foreground mt-1">para atribuição</p>
              </div>

              <div className="p-4 border rounded-lg bg-card">
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">
                  {formatPercentage((stats.embalagens_disponiveis / (stats.embalagens_disponiveis + stats.embalagens_atribuidas || 1)) * 100, 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Embalagens Disponíveis</p>
                <p className="text-xs text-muted-foreground mt-1">para atribuição</p>
              </div>
            </div>

            {/* Action Call */}
            <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full p-2 mt-1">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Próximo Passo: Reconciliação</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Para atribuir estes impactos disponíveis às quotas CDV em geração, 
                    acesse a aba <strong>Reconciliação</strong> e execute o processo de atribuição automática.
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    💡 A reconciliação vincula automaticamente os impactos acumulados (resíduos, educação e embalagens) 
                    às quotas que ainda não atingiram 100% das metas.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onNavigateToReconciliation}
                    className="gap-2"
                  >
                    Ir para Reconciliação
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Detalhados de Estoque</CardTitle>
          <CardDescription>
            Visualize cada registro individual de impacto capturado pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="residuos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="residuos" className="flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Resíduos
              </TabsTrigger>
              <TabsTrigger value="educacao" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Educação
              </TabsTrigger>
              <TabsTrigger value="embalagens" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Embalagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="residuos" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Submaterial</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Cooperativa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quota CDV</TableHead>
                      <TableHead>Projeto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residuosDetalhados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum registro de resíduo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      residuosDetalhados.map((residuo) => (
                        <TableRow key={residuo.id}>
                          <TableCell className="font-medium">
                            {formatDate(residuo.data_entrega)}
                          </TableCell>
                          <TableCell>{residuo.submaterial}</TableCell>
                          <TableCell>{formatNumber(Number(residuo.kg), 3)} kg</TableCell>
                          <TableCell>{residuo.cooperativas?.nome_fantasia || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={residuo.status === "disponivel" ? "default" : "secondary"}>
                              {residuo.status === "disponivel" ? "Disponível" : "Atribuído"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {residuo.cdv_quotas?.numero_quota ? (
                              <Badge variant="outline" className="text-xs">
                                {residuo.cdv_quotas.numero_quota}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {residuo.cdv_quotas?.cdv_projetos?.titulo || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="educacao" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Minutos</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quota CDV</TableHead>
                      <TableHead>Projeto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {educacaoDetalhada.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum registro de educação encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      educacaoDetalhada.map((educacao) => (
                        <TableRow key={educacao.id}>
                          <TableCell className="font-medium">
                            {formatDate(educacao.data)}
                          </TableCell>
                          <TableCell>{educacao.modulo}</TableCell>
                          <TableCell>{formatNumber(Number(educacao.minutos_assistidos), 1)} min</TableCell>
                          <TableCell>{educacao.profiles?.nome || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={educacao.status === "disponivel" ? "default" : "secondary"}>
                              {educacao.status === "disponivel" ? "Disponível" : "Atribuído"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {educacao.cdv_quotas?.numero_quota ? (
                              <Badge variant="outline" className="text-xs">
                                {educacao.cdv_quotas.numero_quota}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {educacao.cdv_quotas?.cdv_projetos?.titulo || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="embalagens" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>GTIN</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo Embalagem</TableHead>
                      <TableHead>Reciclabilidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quota CDV</TableHead>
                      <TableHead>Projeto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {embalagensDetalhadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum registro de embalagem encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      embalagensDetalhadas.map((embalagem) => (
                        <TableRow key={embalagem.id}>
                          <TableCell className="font-medium">
                            {formatDate(embalagem.data)}
                          </TableCell>
                          <TableCell>{embalagem.gtin}</TableCell>
                          <TableCell>{embalagem.nome_produto}</TableCell>
                          <TableCell>{embalagem.tipo_embalagem || "-"}</TableCell>
                          <TableCell>
                            {embalagem.reciclabilidade !== null 
                              ? `${formatNumber(Number(embalagem.reciclabilidade), 0)}%`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={embalagem.status === "disponivel" ? "default" : "secondary"}>
                              {embalagem.status === "disponivel" ? "Disponível" : "Atribuído"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {embalagem.cdv_quotas?.numero_quota ? (
                              <Badge variant="outline" className="text-xs">
                                {embalagem.cdv_quotas.numero_quota}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {embalagem.cdv_quotas?.cdv_projetos?.titulo || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCDVStock;
