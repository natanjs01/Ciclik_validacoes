import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Plus, TrendingUp, DollarSign, Recycle, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MetricComparison } from '@/components/MetricComparison';

export default function CompanyMetricsDashboard() {
  const { id } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [metricsComparacao, setMetricsComparacao] = useState<any>(null);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filtros de período
  const [periodoAtualInicio, setPeriodoAtualInicio] = useState<Date | undefined>(subDays(new Date(), 30));
  const [periodoAtualFim, setPeriodoAtualFim] = useState<Date | undefined>(new Date());
  const [periodoAnteriorInicio, setPeriodoAnteriorInicio] = useState<Date | undefined>(subDays(new Date(), 60));
  const [periodoAnteriorFim, setPeriodoAnteriorFim] = useState<Date | undefined>(subDays(new Date(), 31));
  
  const [formData, setFormData] = useState({
    data_registro: format(new Date(), 'yyyy-MM-dd'),
    faturamento_verde: '',
    faturamento_total: '',
    taxa_recuperacao: '',
    toneladas_recuperadas: '',
    cupons_emitidos: '',
    notas_fiscais_validadas: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadCompanyData();
      loadMetrics();
      loadMetricsComparison();
    }
  }, [id, periodoAtualInicio, periodoAtualFim, periodoAnteriorInicio, periodoAnteriorFim]);

  const loadCompanyData = async () => {
    const { data } = await supabase
      .from('empresas')
      .select(`
        *,
        profiles:id_user (nome, email, cnpj)
      `)
      .eq('id', id)
      .single();
    
    if (data) {
      setCompany(data);
    }
  };

  const loadMetrics = async () => {
    const { data } = await supabase
      .from('metricas_empresas')
      .select('*')
      .eq('id_empresa', id)
      .order('data_registro', { ascending: true});
    
    if (data) {
      setMetrics(data);
    }
  };

  const loadMetricsComparison = async () => {
    if (!periodoAtualInicio || !periodoAtualFim) return;

    // Métricas período atual
    const { data: dataAtual } = await supabase
      .from('metricas_empresas')
      .select('*')
      .eq('id_empresa', id)
      .gte('data_registro', periodoAtualInicio.toISOString())
      .lte('data_registro', periodoAtualFim.toISOString())
      .order('data_registro', { ascending: false });

    // Métricas período anterior
    let dataAnterior = null;
    if (periodoAnteriorInicio && periodoAnteriorFim) {
      const result = await supabase
        .from('metricas_empresas')
        .select('*')
        .eq('id_empresa', id)
        .gte('data_registro', periodoAnteriorInicio.toISOString())
        .lte('data_registro', periodoAnteriorFim.toISOString())
        .order('data_registro', { ascending: false});
      
      dataAnterior = result.data;
    }

    // Calcular médias ou somar valores
    const calculateAverage = (data: any[], field: string) => {
      if (!data || data.length === 0) return 0;
      const sum = data.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
      return sum / data.length;
    };

    const calculateSum = (data: any[], field: string) => {
      if (!data || data.length === 0) return 0;
      return data.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
    };

    if (dataAtual && dataAtual.length > 0) {
      const metricsAtual = {
        percentual_faturamento_verde: calculateAverage(dataAtual, 'percentual_faturamento_verde'),
        taxa_recuperacao: calculateAverage(dataAtual, 'taxa_recuperacao'),
        toneladas_recuperadas: calculateSum(dataAtual, 'toneladas_recuperadas'),
        cupons_emitidos: calculateSum(dataAtual, 'cupons_emitidos'),
        notas_fiscais_validadas: calculateSum(dataAtual, 'notas_fiscais_validadas'),
        faturamento_verde: calculateSum(dataAtual, 'faturamento_verde'),
        faturamento_total: calculateSum(dataAtual, 'faturamento_total'),
      };

      const metricsAnterior = dataAnterior && dataAnterior.length > 0 ? {
        percentual_faturamento_verde: calculateAverage(dataAnterior, 'percentual_faturamento_verde'),
        taxa_recuperacao: calculateAverage(dataAnterior, 'taxa_recuperacao'),
        toneladas_recuperadas: calculateSum(dataAnterior, 'toneladas_recuperadas'),
        cupons_emitidos: calculateSum(dataAnterior, 'cupons_emitidos'),
        notas_fiscais_validadas: calculateSum(dataAnterior, 'notas_fiscais_validadas'),
        faturamento_verde: calculateSum(dataAnterior, 'faturamento_verde'),
        faturamento_total: calculateSum(dataAnterior, 'faturamento_total'),
      } : null;

      setMetricsComparacao({ atual: metricsAtual, anterior: metricsAnterior });
    }
  };

  const handleAddMetric = async () => {
    if (!formData.data_registro) {
      toast({
        title: 'Campo obrigatório',
        description: 'Data de registro é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const faturamentoVerde = formData.faturamento_verde ? parseFloat(formData.faturamento_verde) : null;
      const faturamentoTotal = formData.faturamento_total ? parseFloat(formData.faturamento_total) : null;
      
      let percentualFaturamentoVerde = null;
      if (faturamentoVerde && faturamentoTotal && faturamentoTotal > 0) {
        percentualFaturamentoVerde = (faturamentoVerde / faturamentoTotal) * 100;
      }

      const { error } = await supabase
        .from('metricas_empresas')
        .insert({
          id_empresa: id,
          data_registro: formData.data_registro,
          faturamento_verde: faturamentoVerde,
          faturamento_total: faturamentoTotal,
          percentual_faturamento_verde: percentualFaturamentoVerde,
          taxa_recuperacao: formData.taxa_recuperacao ? parseFloat(formData.taxa_recuperacao) : null,
          toneladas_recuperadas: formData.toneladas_recuperadas ? parseFloat(formData.toneladas_recuperadas) : null,
          cupons_emitidos: formData.cupons_emitidos ? parseInt(formData.cupons_emitidos) : 0,
          notas_fiscais_validadas: formData.notas_fiscais_validadas ? parseInt(formData.notas_fiscais_validadas) : 0,
        });

      if (error) throw error;

      toast({
        title: 'Métrica adicionada!',
        description: 'Os dados foram salvos com sucesso'
      });

      setIsAddMetricOpen(false);
      resetForm();
      loadMetrics();
      loadCompanyData();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar métrica',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      data_registro: format(new Date(), 'yyyy-MM-dd'),
      faturamento_verde: '',
      faturamento_total: '',
      taxa_recuperacao: '',
      toneladas_recuperadas: '',
      cupons_emitidos: '',
      notas_fiscais_validadas: '',
    });
  };

  const formatChartData = () => {
    return metrics.map(m => ({
      data: format(new Date(m.data_registro), 'dd/MM/yy', { locale: ptBR }),
      'Faturamento Verde (%)': m.percentual_faturamento_verde?.toFixed(2) || 0,
      'Taxa Recuperação (%)': m.taxa_recuperacao?.toFixed(2) || 0,
      'Toneladas': m.toneladas_recuperadas?.toFixed(2) || 0,
    }));
  };

  const formatActivityData = () => {
    return metrics.map(m => ({
      data: format(new Date(m.data_registro), 'dd/MM/yy', { locale: ptBR }),
      'Cupons': m.cupons_emitidos || 0,
      'Notas Fiscais': m.notas_fiscais_validadas || 0,
    }));
  };

  const getLatestMetric = () => {
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  };

  const latestMetric = getLatestMetric();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/companies')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => setIsAddMetricOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Métrica
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{company?.profiles?.nome || 'Carregando...'}</h1>
          <p className="text-muted-foreground">Dashboard de Métricas e Performance</p>
        </div>

        {/* Current Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faturamento Verde
              </CardDescription>
              <CardTitle className="text-2xl">
                {latestMetric?.percentual_faturamento_verde?.toFixed(1) || '0'}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Recycle className="h-4 w-4" />
                Taxa Recuperação
              </CardDescription>
              <CardTitle className="text-2xl">
                {latestMetric?.taxa_recuperacao?.toFixed(1) || '0'}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Toneladas Recuperadas
              </CardDescription>
              <CardTitle className="text-2xl">
                {latestMetric?.toneladas_recuperadas?.toFixed(1) || '0'}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cupons Emitidos
              </CardDescription>
              <CardTitle className="text-2xl">
                {latestMetric?.cupons_emitidos || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        {metrics.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Evolução de Faturamento Verde e Recuperação</CardTitle>
                <CardDescription>Percentuais ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Faturamento Verde (%)" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Taxa Recuperação (%)" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Toneladas Recuperadas</CardTitle>
                <CardDescription>Volume de material reciclado ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="Toneladas" 
                      fill="hsl(var(--accent))" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Operacional</CardTitle>
                <CardDescription>Cupons emitidos e notas fiscais validadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatActivityData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Cupons" fill="hsl(var(--primary))" />
                    <Bar dataKey="Notas Fiscais" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma métrica registrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando métricas para visualizar a evolução da empresa
              </p>
              <Button onClick={() => setIsAddMetricOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Métrica
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isAddMetricOpen} onOpenChange={setIsAddMetricOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Métrica</DialogTitle>
              <DialogDescription>
                Registre os dados de performance da empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="data_registro">Data de Registro *</Label>
                <Input
                  id="data_registro"
                  type="date"
                  value={formData.data_registro}
                  onChange={(e) => setFormData({ ...formData, data_registro: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="faturamento_verde">Faturamento Verde (R$)</Label>
                  <Input
                    id="faturamento_verde"
                    type="number"
                    step="0.01"
                    value={formData.faturamento_verde}
                    onChange={(e) => setFormData({ ...formData, faturamento_verde: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="faturamento_total">Faturamento Total (R$)</Label>
                  <Input
                    id="faturamento_total"
                    type="number"
                    step="0.01"
                    value={formData.faturamento_total}
                    onChange={(e) => setFormData({ ...formData, faturamento_total: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxa_recuperacao">Taxa de Recuperação (%)</Label>
                  <Input
                    id="taxa_recuperacao"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxa_recuperacao}
                    onChange={(e) => setFormData({ ...formData, taxa_recuperacao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="toneladas_recuperadas">Toneladas Recuperadas</Label>
                  <Input
                    id="toneladas_recuperadas"
                    type="number"
                    step="0.01"
                    value={formData.toneladas_recuperadas}
                    onChange={(e) => setFormData({ ...formData, toneladas_recuperadas: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cupons_emitidos">Cupons Emitidos</Label>
                  <Input
                    id="cupons_emitidos"
                    type="number"
                    value={formData.cupons_emitidos}
                    onChange={(e) => setFormData({ ...formData, cupons_emitidos: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="notas_fiscais_validadas">Notas Fiscais Validadas</Label>
                  <Input
                    id="notas_fiscais_validadas"
                    type="number"
                    value={formData.notas_fiscais_validadas}
                    onChange={(e) => setFormData({ ...formData, notas_fiscais_validadas: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddMetric}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Métrica'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}