import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, Package } from 'lucide-react';
import { formatWeight } from '@/lib/formatters';

interface MonthlyData {
  mes: string;
  peso: number;
  cor: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export default function DeliveryEvolutionChart({ userId }: { userId: string }) {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [totalKg, setTotalKg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('entregas_reciclaveis')
        .select('peso_validado, data_validacao')
        .eq('id_usuario', userId)
        .eq('status_promessa', 'finalizada')
        .not('peso_validado', 'is', null)
        .not('data_validacao', 'is', null);

      if (error) throw error;

      // Agrupar por mês
      const monthlyMap = new Map<string, number>();
      let total = 0;

      data?.forEach(entrega => {
        const date = new Date(entrega.data_validacao);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${MESES[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
        
        const current = monthlyMap.get(monthLabel) || 0;
        monthlyMap.set(monthLabel, current + (entrega.peso_validado || 0));
        total += entrega.peso_validado || 0;
      });

      // Converter para array e ordenar
      const chartArray = Array.from(monthlyMap.entries())
        .map(([mes, peso], index) => ({
          mes,
          peso: parseFloat(peso.toFixed(2)),
          cor: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => {
          const [mesA, anoA] = a.mes.split('/');
          const [mesB, anoB] = b.mes.split('/');
          const dataA = new Date(2000 + parseInt(anoA), MESES.indexOf(mesA));
          const dataB = new Date(2000 + parseInt(anoB), MESES.indexOf(mesB));
          return dataA.getTime() - dataB.getTime();
        })
        .slice(-6); // Últimos 6 meses

      setChartData(chartArray);
      setTotalKg(total);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].payload.mes}</p>
          <p className="text-primary font-bold">{formatWeight(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução de Entregas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução de Entregas
          </CardTitle>
          <CardDescription>Acompanhe seu progresso mensal</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Você ainda não tem entregas finalizadas.<br />
            Comece a reciclar para ver seu progresso!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolução de Entregas
        </CardTitle>
        <CardDescription>
          Últimos {chartData.length} {chartData.length === 1 ? 'mês' : 'meses'} de reciclagem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="peso"
                label={({ mes, peso }) => `${mes}: ${formatWeight(peso)}`}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centro do gráfico com total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/95 rounded-full w-32 h-32 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground font-medium">Total de</p>
              <p className="text-xs text-muted-foreground font-medium">Recicláveis</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatWeight(totalKg)}</p>
            </div>
          </div>
        </div>

        {/* Legenda personalizada */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.cor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.mes}</p>
                <p className="text-xs text-muted-foreground">{formatWeight(item.peso)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas rápidas */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{chartData.length}</p>
            <p className="text-xs text-muted-foreground">{chartData.length === 1 ? 'Mês' : 'Meses'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatWeight(totalKg / chartData.length)}
            </p>
            <p className="text-xs text-muted-foreground">Média/Mês</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatWeight(Math.max(...chartData.map(d => d.peso)))}
            </p>
            <p className="text-xs text-muted-foreground">Melhor Mês</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
