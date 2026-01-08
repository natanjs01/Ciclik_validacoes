import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Package, FileText, Coins } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyOwnMetrics() {
  const { user, profile } = useAuth();
  const [empresa, setEmpresa] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanyData();
  }, [user]);

  const loadCompanyData = async () => {
    if (!user) return;

    const { data: empresaData } = await supabase
      .from('empresas')
      .select('*')
      .eq('id_user', user.id)
      .single();

    if (empresaData) {
      setEmpresa(empresaData);
      loadMetrics(empresaData.id);
    }
  };

  const loadMetrics = async (empresaId: string) => {
    const { data } = await supabase
      .from('metricas_empresas')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('data_registro', { ascending: true });

    if (data) setMetrics(data);
  };

  const formatChartData = () => {
    return metrics.map(m => ({
      data: format(new Date(m.data_registro), 'dd/MMM', { locale: ptBR }),
      'Faturamento Verde (%)': m.percentual_faturamento_verde?.toFixed(1) || 0,
      'Taxa Recuperação (%)': m.taxa_recuperacao?.toFixed(1) || 0,
    }));
  };

  const formatTonData = () => {
    return metrics.map(m => ({
      data: format(new Date(m.data_registro), 'dd/MMM', { locale: ptBR }),
      'Toneladas': m.toneladas_recuperadas || 0,
    }));
  };

  const formatActivityData = () => {
    return metrics.map(m => ({
      data: format(new Date(m.data_registro), 'dd/MMM', { locale: ptBR }),
      'Cupons Emitidos': m.cupons_emitidos || 0,
      'Notas Validadas': m.notas_fiscais_validadas || 0,
    }));
  };

  const getLatestMetric = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const latest = getLatestMetric();

  if (!empresa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/company')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{profile?.nome}</h1>
              <p className="text-sm text-muted-foreground">Métricas de Desempenho</p>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        {latest && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Verde (%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latest.percentual_faturamento_verde?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Recuperação (%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latest.taxa_recuperacao?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toneladas Recuperadas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latest.toneladas_recuperadas || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cupons Emitidos</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latest.cupons_emitidos || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {metrics.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Nenhuma métrica registrada ainda. Aguarde os administradores adicionarem dados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Line Chart */}
            <Card>
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
                    <Line type="monotone" dataKey="Faturamento Verde (%)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Taxa Recuperação (%)" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Toneladas Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Toneladas Recuperadas</CardTitle>
                <CardDescription>Volume recuperado por período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatTonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Toneladas" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Bar Chart */}
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
                    <Bar dataKey="Cupons Emitidos" fill="hsl(var(--primary))" />
                    <Bar dataKey="Notas Validadas" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
