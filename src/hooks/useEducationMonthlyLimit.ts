/**
 * Hook para gerenciar o limite mensal de pontos de educação
 * 
 * Regras:
 * - Limite de 300 pontos por mês com missões educacionais
 * - Permite assistir vídeos mesmo após o limite (para UIB)
 * - Reseta automaticamente no início de cada mês
 * 
 * @see COMPARACAO_REGRAS_PONTUACAO_VIDEOS.md
 */

import { supabase } from '@/integrations/supabase/client';

// Constante do limite mensal
export const MONTHLY_LIMIT = 300;

export interface MonthlyLimitResult {
  currentPoints: number;
  withinLimit: boolean;
  remainingPoints: number;
}

export interface CanEarnPointsResult {
  canEarn: boolean;
  pointsToEarn: number;
  message: string | null;
}

export function useEducationMonthlyLimit() {
  /**
   * Verifica o limite mensal de educação para um usuário
   * @param userId ID do usuário
   * @returns Informações sobre os pontos do mês
   */
  const checkMonthlyLimit = async (userId: string): Promise<MonthlyLimitResult> => {
    try {
      // Calcular o início do mês atual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      // Buscar todas as missões concluídas no mês atual
      const { data: completedMissions, error } = await supabase
        .from('missoes_usuarios')
        .select(`
          id_missao,
          missoes (
            pontos
          )
        `)
        .eq('id_usuario', userId)
        .gte('data_conclusao', startOfMonth.toISOString());

      if (error) {
        console.error('Erro ao verificar limite mensal:', error);
        return {
          currentPoints: 0,
          withinLimit: true,
          remainingPoints: MONTHLY_LIMIT
        };
      }

      // Calcular total de pontos ganhos no mês
      const currentPoints = completedMissions?.reduce((sum, item: any) => {
        const pontos = item.missoes?.pontos || 0;
        return sum + pontos;
      }, 0) || 0;

      const withinLimit = currentPoints < MONTHLY_LIMIT;
      const remainingPoints = Math.max(0, MONTHLY_LIMIT - currentPoints);

      return {
        currentPoints,
        withinLimit,
        remainingPoints
      };
    } catch (error) {
      console.error('Erro ao verificar limite mensal:', error);
      return {
        currentPoints: 0,
        withinLimit: true,
        remainingPoints: MONTHLY_LIMIT
      };
    }
  };

  /**
   * Verifica se o usuário pode ganhar pontos e quantos
   * @param userId ID do usuário
   * @param missionPoints Pontos da missão
   * @returns Informações sobre possibilidade de ganhar pontos
   */
  const canEarnPoints = async (
    userId: string, 
    missionPoints: number
  ): Promise<CanEarnPointsResult> => {
    try {
      const limitCheck = await checkMonthlyLimit(userId);

      // Se já atingiu o limite
      if (limitCheck.currentPoints >= MONTHLY_LIMIT) {
        return {
          canEarn: false,
          pointsToEarn: 0,
          message: `Você atingiu o limite mensal de ${MONTHLY_LIMIT} pontos com educação. Continue aprendendo - suas aulas ainda contam para UIBs!`
        };
      }

      // Calcular quantos pontos pode ganhar
      const pointsToEarn = Math.min(
        missionPoints,
        limitCheck.remainingPoints
      );

      // Se vai ganhar menos pontos que o total da missão
      if (pointsToEarn < missionPoints) {
        return {
          canEarn: true,
          pointsToEarn,
          message: `Você ganhou ${pointsToEarn} pontos (limite mensal de ${MONTHLY_LIMIT} quase atingido). Faltam ${MONTHLY_LIMIT - limitCheck.currentPoints - pointsToEarn} pontos para o limite.`
        };
      }

      // Pode ganhar todos os pontos
      return {
        canEarn: true,
        pointsToEarn,
        message: null
      };
    } catch (error) {
      console.error('Erro ao verificar possibilidade de ganhar pontos:', error);
      // Em caso de erro, permite ganhar pontos (fail-safe)
      return {
        canEarn: true,
        pointsToEarn: missionPoints,
        message: null
      };
    }
  };

  return {
    checkMonthlyLimit,
    canEarnPoints,
    MONTHLY_LIMIT
  };
}
