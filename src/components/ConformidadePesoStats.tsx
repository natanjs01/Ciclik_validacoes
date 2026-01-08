import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatPercentage, formatNumber } from '@/lib/formatters';

interface ConformidadeStats {
  total_entregas: number;
  entregas_dentro_margem: number;
  taxa_conformidade: number;
  variacao_media: number;
  pontos_totais_base: number;
  pontos_totais_aplicados: number;
  eficiencia_pontuacao: number;
}

interface ConformidadePesoStatsProps {
  userId?: string;
}

export default function ConformidadePesoStats({ userId }: ConformidadePesoStatsProps) {
  const [stats, setStats] = useState<ConformidadeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      let query = supabase
        .from('variacoes_peso_entrega')
        .select('*');
      
      if (userId) {
        query = query.eq('id_usuario', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const totalEntregas = data.length;
        const dentroMargem = data.filter(v => v.dentro_margem).length;
        const variacaoMedia = data.reduce((sum, v) => sum + Number(v.variacao_percentual), 0) / totalEntregas;
        const pontosTotaisBase = data.reduce((sum, v) => sum + Number(v.pontos_base), 0);
        const pontosTotaisAplicados = data.reduce((sum, v) => sum + Number(v.pontos_aplicados), 0);

        setStats({
          total_entregas: totalEntregas,
          entregas_dentro_margem: dentroMargem,
          taxa_conformidade: (dentroMargem / totalEntregas) * 100,
          variacao_media: variacaoMedia,
          pontos_totais_base: pontosTotaisBase,
          pontos_totais_aplicados: pontosTotaisAplicados,
          eficiencia_pontuacao: pontosTotaisBase > 0 ? (pontosTotaisAplicados / pontosTotaisBase) * 100 : 100
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">Carregando estatísticas...</div>;
  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conformidade</CardTitle>
          {stats.taxa_conformidade >= 80 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(stats.taxa_conformidade)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.entregas_dentro_margem} de {stats.total_entregas} entregas
          </p>
          <Progress value={stats.taxa_conformidade} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variação Média</CardTitle>
          {stats.variacao_media <= 10 ? (
            <TrendingDown className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(stats.variacao_media, 2)}</div>
          <p className="text-xs text-muted-foreground">
            Diferença entre estimado e validado
          </p>
          <Badge variant={stats.variacao_media <= 10 ? 'default' : 'destructive'} className="mt-2">
            {stats.variacao_media <= 10 ? 'Excelente' : 'Atenção'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiência de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.eficiencia_pontuacao, 0)}%</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.pontos_totais_aplicados, 0)} de {formatNumber(stats.pontos_totais_base, 0)} pontos
          </p>
          <Progress value={stats.eficiencia_pontuacao} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_entregas}</div>
          <p className="text-xs text-muted-foreground">
            Entregas validadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
