import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Users, Recycle, Gift, FileText, Building2, PackageSearch, CalendarIcon, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MetricComparison } from '@/components/MetricComparison';

interface Stats {
  usuarios_totais: number;
  usuarios_ativos: number;
  cooperativas_ativas: number;
  entregas_total: number;
  peso_total_kg: number;
  cupons_disponiveis: number;
  cupons_resgatados: number;
  cupons_usados: number;
  notas_pendentes: number;
  notas_validadas: number;
  missoes_ativas: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface Cooperativa {
  id: string;
  nome_fantasia: string;
  cidade: string;
  uf: string;
}

interface EntregaData {
  tipo_material: string;
  peso_total: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--chart-3))'];

export default function AdminKPIs() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    usuarios_totais: 0,
    usuarios_ativos: 0,
    cooperativas_ativas: 0,
    entregas_total: 0,
    peso_total_kg: 0,
    cupons_disponiveis: 0,
    cupons_resgatados: 0,
    cupons_usados: 0,
    notas_pendentes: 0,
    notas_validadas: 0,
    missoes_ativas: 0,
  });
  const [statsComparacao, setStatsComparacao] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros de período para KPIs
  const [periodoAtualInicio, setPeriodoAtualInicio] = useState<Date | undefined>(subDays(new Date(), 30));
  const [periodoAtualFim, setPeriodoAtualFim] = useState<Date | undefined>(new Date());
  const [periodoAnteriorInicio, setPeriodoAnteriorInicio] = useState<Date | undefined>(subDays(new Date(), 60));
  const [periodoAnteriorFim, setPeriodoAnteriorFim] = useState<Date | undefined>(subDays(new Date(), 31));
  
  // Filtros geográficos para KPIs
  const [filtroEstadoKPI, setFiltroEstadoKPI] = useState<string>('todos');
  const [filtroCidadeKPI, setFiltroCidadeKPI] = useState<string>('todas');
  
  // Filtros de resíduos
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [filtroCooperativa, setFiltroCooperativa] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todas');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [entregasData, setEntregasData] = useState<EntregaData[]>([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  
  // Dados temporais para gráficos comparativos
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    loadKPIs();
    loadCooperativas();
    loadTimelineData();
  }, [periodoAtualInicio, periodoAtualFim, periodoAnteriorInicio, periodoAnteriorFim, filtroEstadoKPI, filtroCidadeKPI]);

  useEffect(() => {
    loadEntregas();
  }, [filtroCooperativa, filtroEstado, filtroCidade, dataInicio, dataFim]);

  const loadKPIs = async () => {
    try {
      // Carregar KPIs período atual
      const statsAtual = await loadKPIsPeriodo(periodoAtualInicio, periodoAtualFim, filtroEstadoKPI, filtroCidadeKPI);
      setStats(statsAtual);

      // Carregar KPIs período anterior para comparação
      if (periodoAnteriorInicio && periodoAnteriorFim) {
        const statsAnterior = await loadKPIsPeriodo(periodoAnteriorInicio, periodoAnteriorFim, filtroEstadoKPI, filtroCidadeKPI);
        setStatsComparacao(statsAnterior);
      } else {
        setStatsComparacao(null);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIsPeriodo = async (dataInicio?: Date, dataFim?: Date, estado?: string, cidade?: string): Promise<Stats> => {
    const queries: any[] = [];

    // Usuários cadastrados no período
    let usuariosQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (dataInicio) usuariosQuery = usuariosQuery.gte('data_cadastro', dataInicio.toISOString());
    if (dataFim) {
      const dataFimAjustada = new Date(dataFim);
      dataFimAjustada.setHours(23, 59, 59, 999);
      usuariosQuery = usuariosQuery.lte('data_cadastro', dataFimAjustada.toISOString());
    }
    if (estado && estado !== 'todos') usuariosQuery = usuariosQuery.eq('uf', estado);
    if (cidade && cidade !== 'todas') usuariosQuery = usuariosQuery.eq('cidade', cidade);

    // Cooperativas no período
    let coopQuery = supabase.from('cooperativas').select('id', { count: 'exact', head: true }).eq('status', 'aprovada');
    if (dataInicio) coopQuery = coopQuery.gte('data_cadastro', dataInicio.toISOString());
    if (dataFim) {
      const dataFimAjustada = new Date(dataFim);
      dataFimAjustada.setHours(23, 59, 59, 999);
      coopQuery = coopQuery.lte('data_cadastro', dataFimAjustada.toISOString());
    }
    if (estado && estado !== 'todos') coopQuery = coopQuery.eq('uf', estado);
    if (cidade && cidade !== 'todas') coopQuery = coopQuery.eq('cidade', cidade);

    // Entregas no período - precisa join com cooperativas para filtro geográfico
    let entregasQuery = supabase
      .from('entregas_reciclaveis')
      .select('peso_validado, data_validacao, cooperativas!inner(uf, cidade)')
      .eq('status', 'validada');
    if (dataInicio) entregasQuery = entregasQuery.gte('data_validacao', dataInicio.toISOString());
    if (dataFim) {
      const dataFimAjustada = new Date(dataFim);
      dataFimAjustada.setHours(23, 59, 59, 999);
      entregasQuery = entregasQuery.lte('data_validacao', dataFimAjustada.toISOString());
    }
    if (estado && estado !== 'todos') entregasQuery = entregasQuery.eq('cooperativas.uf', estado);
    if (cidade && cidade !== 'todas') entregasQuery = entregasQuery.eq('cooperativas.cidade', cidade);

    // Cupons resgatados no período - precisa join com profiles
    let cuponsResgQuery = supabase
      .from('cupons_resgates')
      .select('id, data_resgate, profiles!inner(uf, cidade)', { count: 'exact', head: true });
    if (dataInicio) cuponsResgQuery = cuponsResgQuery.gte('data_resgate', dataInicio.toISOString());
    if (dataFim) {
      const dataFimAjustada = new Date(dataFim);
      dataFimAjustada.setHours(23, 59, 59, 999);
      cuponsResgQuery = cuponsResgQuery.lte('data_resgate', dataFimAjustada.toISOString());
    }
    if (estado && estado !== 'todos') cuponsResgQuery = cuponsResgQuery.eq('profiles.uf', estado);
    if (cidade && cidade !== 'todas') cuponsResgQuery = cuponsResgQuery.eq('profiles.cidade', cidade);

    // Notas validadas no período - precisa join com profiles
    let notasValidQuery = supabase
      .from('notas_fiscais')
      .select('id, profiles!inner(uf, cidade)', { count: 'exact', head: true })
      .eq('status_validacao', 'valida');
    if (dataInicio) notasValidQuery = notasValidQuery.gte('data_envio', dataInicio.toISOString());
    if (dataFim) {
      const dataFimAjustada = new Date(dataFim);
      dataFimAjustada.setHours(23, 59, 59, 999);
      notasValidQuery = notasValidQuery.lte('data_envio', dataFimAjustada.toISOString());
    }
    if (estado && estado !== 'todos') notasValidQuery = notasValidQuery.eq('profiles.uf', estado);
    if (cidade && cidade !== 'todas') notasValidQuery = notasValidQuery.eq('profiles.cidade', cidade);

    const [
      usuarios,
      cooperativas,
      entregas,
      cuponsDisp,
      cuponsResg,
      cuponsUsados,
      notasPend,
      notasValid,
      missoes,
    ] = await Promise.all([
      usuariosQuery,
      coopQuery,
      entregasQuery,
      supabase.from('cupons').select('id', { count: 'exact', head: true }).eq('status', 'disponivel'),
      cuponsResgQuery,
      supabase.from('cupons').select('id', { count: 'exact', head: true }).eq('status', 'usado'),
      supabase.from('notas_fiscais').select('id', { count: 'exact', head: true }).eq('status_validacao', 'pendente'),
      notasValidQuery,
      supabase.from('missoes').select('id', { count: 'exact', head: true }).eq('status', 'ativa'),
    ]);

    const pesoTotal = entregas.data?.reduce((acc, e) => acc + (Number(e.peso_validado) || 0), 0) || 0;

    return {
      usuarios_totais: usuarios.count || 0,
      usuarios_ativos: usuarios.count || 0,
      cooperativas_ativas: cooperativas.count || 0,
      entregas_total: entregas.data?.length || 0,
      peso_total_kg: Math.round(pesoTotal),
      cupons_disponiveis: cuponsDisp.count || 0,
      cupons_resgatados: cuponsResg.count || 0,
      cupons_usados: cuponsUsados.count || 0,
      notas_pendentes: notasPend.count || 0,
      notas_validadas: notasValid.count || 0,
      missoes_ativas: missoes.count || 0,
    };
  };

  const loadCooperativas = async () => {
    const { data } = await supabase
      .from('cooperativas')
      .select('id, nome_fantasia, cidade, uf')
      .eq('status', 'aprovada')
      .order('nome_fantasia');
    
    if (data) setCooperativas(data);
  };

  const loadTimelineData = async () => {
    if (!periodoAtualInicio || !periodoAtualFim) return;

    try {
      // Carregar entregas do período atual
      let queryAtual = supabase
        .from('entregas_reciclaveis')
        .select('data_validacao, peso_validado, cooperativas!inner(uf, cidade)')
        .eq('status', 'validada')
        .gte('data_validacao', periodoAtualInicio.toISOString())
        .lte('data_validacao', periodoAtualFim.toISOString());
      
      if (filtroEstadoKPI && filtroEstadoKPI !== 'todos') {
        queryAtual = queryAtual.eq('cooperativas.uf', filtroEstadoKPI);
      }
      if (filtroCidadeKPI && filtroCidadeKPI !== 'todas') {
        queryAtual = queryAtual.eq('cooperativas.cidade', filtroCidadeKPI);
      }
      
      queryAtual = queryAtual.order('data_validacao');
      const { data: entregasAtual } = await queryAtual;

      // Carregar entregas do período anterior
      let entregasAnterior = null;
      if (periodoAnteriorInicio && periodoAnteriorFim) {
        let queryAnterior = supabase
          .from('entregas_reciclaveis')
          .select('data_validacao, peso_validado, cooperativas!inner(uf, cidade)')
          .eq('status', 'validada')
          .gte('data_validacao', periodoAnteriorInicio.toISOString())
          .lte('data_validacao', periodoAnteriorFim.toISOString());
        
        if (filtroEstadoKPI && filtroEstadoKPI !== 'todos') {
          queryAnterior = queryAnterior.eq('cooperativas.uf', filtroEstadoKPI);
        }
        if (filtroCidadeKPI && filtroCidadeKPI !== 'todas') {
          queryAnterior = queryAnterior.eq('cooperativas.cidade', filtroCidadeKPI);
        }
        
        queryAnterior = queryAnterior.order('data_validacao');
        const result = await queryAnterior;
        
        entregasAnterior = result.data;
      }

      // Agrupar por data
      const groupByDate = (data: any[]) => {
        if (!data) return {};
        return data.reduce((acc: any, item: any) => {
          const date = format(new Date(item.data_validacao), 'dd/MM/yyyy', { locale: ptBR });
          if (!acc[date]) {
            acc[date] = { peso: 0, count: 0 };
          }
          acc[date].peso += Number(item.peso_validado) || 0;
          acc[date].count += 1;
          return acc;
        }, {});
      };

      const groupedAtual = groupByDate(entregasAtual || []);
      const groupedAnterior = groupByDate(entregasAnterior || []);

      // Criar array de datas do período atual
      const timeline: any[] = [];
      if (entregasAtual) {
        Object.keys(groupedAtual).forEach(date => {
          timeline.push({
            data: date,
            'Período Atual - Peso (kg)': groupedAtual[date].peso,
            'Período Atual - Entregas': groupedAtual[date].count,
          });
        });
      }

      // Adicionar dados do período anterior
      if (entregasAnterior) {
        Object.keys(groupedAnterior).forEach(date => {
          const existing = timeline.find(t => t.data === date);
          if (existing) {
            existing['Período Anterior - Peso (kg)'] = groupedAnterior[date].peso;
            existing['Período Anterior - Entregas'] = groupedAnterior[date].count;
          } else {
            timeline.push({
              data: date,
              'Período Anterior - Peso (kg)': groupedAnterior[date].peso,
              'Período Anterior - Entregas': groupedAnterior[date].count,
            });
          }
        });
      }

      setTimelineData(timeline);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    }
  };

  const loadEntregas = async () => {
    setLoadingEntregas(true);
    try {
      let query = supabase
        .from('entregas_reciclaveis')
        .select('tipo_material, peso_validado, data_validacao, cooperativas!inner(id, cidade, uf)')
        .eq('status', 'validada');

      if (filtroCooperativa !== 'todas') {
        query = query.eq('id_cooperativa', filtroCooperativa);
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('cooperativas.uf', filtroEstado);
      }

      if (filtroCidade !== 'todas') {
        query = query.eq('cooperativas.cidade', filtroCidade);
      }

      if (dataInicio) {
        query = query.gte('data_validacao', dataInicio.toISOString());
      }

      if (dataFim) {
        const dataFimAjustada = new Date(dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        query = query.lte('data_validacao', dataFimAjustada.toISOString());
      }

      const { data } = await query;

      if (data) {
        const grouped = data.reduce((acc: any, entrega: any) => {
          const tipo = entrega.tipo_material;
          if (!acc[tipo]) {
            acc[tipo] = 0;
          }
          acc[tipo] += Number(entrega.peso_validado) || 0;
          return acc;
        }, {});

        const chartData = Object.entries(grouped).map(([tipo, peso]) => ({
          tipo_material: tipo,
          peso_total: Number(peso),
        }));

        setEntregasData(chartData);
      }
    } catch (error) {
      console.error('Error loading entregas:', error);
    } finally {
      setLoadingEntregas(false);
    }
  };

  const estados = [...new Set(cooperativas.map(c => c.uf))].filter(Boolean).sort();
  const cidades = [...new Set(cooperativas
    .filter(c => filtroEstado === 'todos' || c.uf === filtroEstado)
    .map(c => c.cidade))].filter(Boolean).sort();

  const cuponsData: ChartData[] = [
    { name: 'Disponíveis', value: stats.cupons_disponiveis },
    { name: 'Resgatados', value: stats.cupons_resgatados },
    { name: 'Usados', value: stats.cupons_usados },
  ];

  const notasData: ChartData[] = [
    { name: 'Pendentes', value: stats.notas_pendentes },
    { name: 'Validadas', value: stats.notas_validadas },
  ];

  const engajamentoData = [
    { name: 'Usuários', value: stats.usuarios_totais },
    { name: 'Cooperativas', value: stats.cooperativas_ativas },
    { name: 'Entregas', value: stats.entregas_total },
    { name: 'Missões', value: stats.missoes_ativas },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">KPIs e Análises</h1>
            <p className="text-muted-foreground">Acompanhe as métricas detalhadas do sistema</p>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">KPIs e Relatórios</h1>
            <p className="text-sm text-muted-foreground">Métricas e estatísticas da plataforma</p>
          </div>
        </div>

        {/* Filtros de Período e Localização */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Análise</CardTitle>
            <CardDescription>Selecione períodos e localização para análise comparativa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Atalhos de Período */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date();
                  setPeriodoAtualInicio(subDays(hoje, 7));
                  setPeriodoAtualFim(hoje);
                  setPeriodoAnteriorInicio(subDays(hoje, 14));
                  setPeriodoAnteriorFim(subDays(hoje, 8));
                }}
              >
                Últimos 7 dias vs anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date();
                  setPeriodoAtualInicio(subDays(hoje, 30));
                  setPeriodoAtualFim(hoje);
                  setPeriodoAnteriorInicio(subDays(hoje, 60));
                  setPeriodoAnteriorFim(subDays(hoje, 31));
                }}
              >
                Últimos 30 dias vs anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hoje = new Date();
                  setPeriodoAtualInicio(subDays(hoje, 90));
                  setPeriodoAtualFim(hoje);
                  setPeriodoAnteriorInicio(subDays(hoje, 180));
                  setPeriodoAnteriorFim(subDays(hoje, 91));
                }}
              >
                Últimos 90 dias vs anterior
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Período Atual */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-sm">Período Atual</h3>
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoAtualInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoAtualInicio ? format(periodoAtualInicio, "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={periodoAtualInicio}
                          onSelect={setPeriodoAtualInicio}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoAtualFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoAtualFim ? format(periodoAtualFim, "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={periodoAtualFim}
                          onSelect={setPeriodoAtualFim}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Período Anterior */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-sm">Período de Comparação</h3>
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoAnteriorInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoAnteriorInicio ? format(periodoAnteriorInicio, "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={periodoAnteriorInicio}
                          onSelect={setPeriodoAnteriorInicio}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !periodoAnteriorFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {periodoAnteriorFim ? format(periodoAnteriorFim, "PPP", { locale: ptBR }) : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={periodoAnteriorFim}
                          onSelect={setPeriodoAnteriorFim}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros Geográficos */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado (UF)</label>
                <Select value={filtroEstadoKPI} onValueChange={setFiltroEstadoKPI}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os estados</SelectItem>
                    {Array.from(new Set(cooperativas.map(c => c.uf))).sort().map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Select 
                  value={filtroCidadeKPI} 
                  onValueChange={setFiltroCidadeKPI}
                  disabled={filtroEstadoKPI === 'todos'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as cidades</SelectItem>
                    {cooperativas
                      .filter(c => filtroEstadoKPI === 'todos' || c.uf === filtroEstadoKPI)
                      .map(c => c.cidade)
                      .filter((cidade, index, self) => self.indexOf(cidade) === index)
                      .sort()
                      .map(cidade => (
                        <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuários Totais
                  </CardDescription>
                  <CardTitle className="text-3xl">{stats.usuarios_totais}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Recycle className="h-4 w-4" />
                    Cooperativas Ativas
                  </CardDescription>
                  <CardTitle className="text-3xl">{stats.cooperativas_ativas}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Entregas Realizadas
                  </CardDescription>
                  <CardTitle className="text-3xl">{stats.entregas_total}</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Recycle className="h-4 w-4" />
                    Peso Total (kg)
                  </CardDescription>
                  <CardTitle className="text-3xl">{stats.peso_total_kg}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Gráficos Temporais Comparativos */}
            {timelineData.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução do Peso de Resíduos</CardTitle>
                    <CardDescription>Comparação entre períodos (kg validados)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                        <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Período Atual - Peso (kg)" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Período Anterior - Peso (kg)" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolução de Entregas Validadas</CardTitle>
                    <CardDescription>Comparação entre períodos (quantidade)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                        <YAxis label={{ value: 'Entregas', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Período Atual - Entregas" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--accent))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Período Anterior - Entregas" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cupons Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Status dos Cupons
                  </CardTitle>
                  <CardDescription>Distribuição de cupons por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cuponsData}
                        cx="50%"
                        cy="45%"
                        labelLine={true}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {cuponsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Notas Fiscais Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Status das Notas Fiscais
                  </CardTitle>
                  <CardDescription>Notas fiscais pendentes vs validadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={notasData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Engajamento Chart */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Visão Geral da Plataforma
                  </CardTitle>
                  <CardDescription>Métricas de engajamento e uso</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engajamentoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="hsl(var(--accent))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Resíduos Entregues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageSearch className="h-5 w-5" />
                  Resíduos Entregues
                </CardTitle>
                <CardDescription>Análise de resíduos por cooperativa, estado e cidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cooperativa</label>
                    <Select value={filtroCooperativa} onValueChange={setFiltroCooperativa}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as cooperativas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as cooperativas</SelectItem>
                        {cooperativas.map(coop => (
                          <SelectItem key={coop.id} value={coop.id}>
                            {coop.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={filtroEstado} onValueChange={(value) => {
                      setFiltroEstado(value);
                      setFiltroCidade('todas');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os estados</SelectItem>
                        {estados.map(uf => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cidade</label>
                    <Select value={filtroCidade} onValueChange={setFiltroCidade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as cidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as cidades</SelectItem>
                        {cidades.map(cidade => (
                          <SelectItem key={cidade} value={cidade}>
                            {cidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataInicio}
                          onSelect={setDataInicio}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                        {dataInicio && (
                          <div className="p-3 border-t">
                            <Button 
                              variant="ghost" 
                              className="w-full"
                              onClick={() => setDataInicio(undefined)}
                            >
                              Limpar
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataFim}
                          onSelect={setDataFim}
                          disabled={(date) => dataInicio ? date < dataInicio : false}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                        {dataFim && (
                          <div className="p-3 border-t">
                            <Button 
                              variant="ghost" 
                              className="w-full"
                              onClick={() => setDataFim(undefined)}
                            >
                              Limpar
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Gráfico */}
                {loadingEntregas ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : entregasData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum dado encontrado para os filtros selecionados</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={entregasData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo_material" />
                      <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} kg`, 'Peso Total']} />
                      <Legend />
                      <Bar dataKey="peso_total" fill="hsl(var(--primary))" name="Peso Total (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
