import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PointsBreakdown {
  missoes: number;
  notasFiscais: number;
  materiaisCadastrados: number;
  entregasValidadas: number;
  indicacoes: number;
  cuponsResgatados: number;
}

interface UseUserPointsReturn {
  pontos: number;
  loading: boolean;
  breakdown: PointsBreakdown;
  refetch: () => Promise<void>;
}

export function useUserPoints(): UseUserPointsReturn {
  const { user } = useAuth();
  const [pontos, setPontos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<PointsBreakdown>({
    missoes: 0,
    notasFiscais: 0,
    materiaisCadastrados: 0,
    entregasValidadas: 0,
    indicacoes: 0,
    cuponsResgatados: 0,
  });

  const calculatePoints = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar configurações de pontos
      const { data: configs } = await supabase
        .from('configuracoes_sistema')
        .select('chave, valor')
        .like('chave', 'pontos_%');

      const pontosConfig: Record<string, number> = {};
      configs?.forEach(config => {
        pontosConfig[config.chave] = parseInt(config.valor);
      });

      let totalPontos = 0;
      const newBreakdown: PointsBreakdown = {
        missoes: 0,
        notasFiscais: 0,
        materiaisCadastrados: 0,
        entregasValidadas: 0,
        indicacoes: 0,
        cuponsResgatados: 0,
      };

      // 1. Missões concluídas
      const { data: missoes } = await supabase
        .from('missoes_usuarios')
        .select('id')
        .eq('id_usuario', user.id);

      const pontosMissao = pontosConfig['pontos_missao_completa'] ?? 0;
      newBreakdown.missoes = (missoes?.length || 0) * pontosMissao;
      totalPontos += newBreakdown.missoes;

      // 2. Notas fiscais validadas
      const { data: notas } = await supabase
        .from('notas_fiscais')
        .select('id')
        .eq('id_usuario', user.id)
        .eq('status_validacao', 'validada');

      const pontosNotaFiscal = pontosConfig['pontos_nota_fiscal_validada'] ?? 0;
      newBreakdown.notasFiscais = (notas?.length || 0) * pontosNotaFiscal;
      totalPontos += newBreakdown.notasFiscais;

      // 3. Materiais cadastrados
      const { data: materiais } = await supabase
        .from('materiais_reciclaveis_usuario')
        .select('id, origem_cadastro')
        .eq('id_usuario', user.id);

      const pontosMaterialNota = pontosConfig['pontos_material_cadastro_nota'] ?? 0;
      const pontosMaterialManual = pontosConfig['pontos_material_cadastro_manual'] ?? 0;

      materiais?.forEach(material => {
        const pts = material.origem_cadastro === 'nota_fiscal' ? pontosMaterialNota : pontosMaterialManual;
        newBreakdown.materiaisCadastrados += pts;
      });
      totalPontos += newBreakdown.materiaisCadastrados;

      // 4. Entregas validadas - usar peso_validado diretamente com fórmula oficial
      const { data: entregas } = await supabase
        .from('entregas_reciclaveis')
        .select('peso_validado, tipo_material')
        .eq('id_usuario', user.id)
        .eq('status', 'validada');

      const pontosEntregaPor6Kg = pontosConfig['pontos_entrega_6kg'] ?? 10;
      let pesoTotalValidado = 0;
      
      entregas?.forEach(entrega => {
        if (entrega.peso_validado && entrega.peso_validado > 0) {
          pesoTotalValidado += entrega.peso_validado;
        }
      });
      
      // Fórmula oficial: floor(peso_total / 6) * pontos_por_6kg
      newBreakdown.entregasValidadas = Math.floor(pesoTotalValidado / 6) * pontosEntregaPor6Kg;
      totalPontos += newBreakdown.entregasValidadas;

      // 5. Indicações
      const { data: indicacoes } = await supabase
        .from('indicacoes')
        .select('pontos_cadastro_concedidos, pontos_primeira_missao_concedidos')
        .eq('id_indicador', user.id);

      const pontosIndicacaoCadastro = pontosConfig['pontos_indicacao_cadastro'] ?? 0;
      const pontosIndicacaoPrimeiraMissao = pontosConfig['pontos_indicacao_primeira_missao'] ?? 0;

      indicacoes?.forEach(indicacao => {
        if (indicacao.pontos_cadastro_concedidos) {
          newBreakdown.indicacoes += pontosIndicacaoCadastro;
        }
        if (indicacao.pontos_primeira_missao_concedidos) {
          newBreakdown.indicacoes += pontosIndicacaoPrimeiraMissao;
        }
      });
      totalPontos += newBreakdown.indicacoes;

      // 6. Cupons resgatados (subtração)
      const { data: cupons } = await supabase
        .from('cupons_resgates')
        .select('pontos_utilizados')
        .eq('id_usuario', user.id);

      cupons?.forEach(cupom => {
        newBreakdown.cuponsResgatados += cupom.pontos_utilizados;
      });
      totalPontos -= newBreakdown.cuponsResgatados;

      // NOTA: Ajustes manuais NÃO são somados - são apenas registros de auditoria

      setPontos(totalPontos);
      setBreakdown(newBreakdown);
    } catch (error) {
      console.error('Erro ao calcular pontos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    calculatePoints();
  }, [calculatePoints]);

  return {
    pontos,
    loading,
    breakdown,
    refetch: calculatePoints,
  };
}
