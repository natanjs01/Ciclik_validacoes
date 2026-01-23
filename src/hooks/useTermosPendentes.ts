/**
 * Hook para verificar e gerenciar termos pendentes de aceite
 * Monitor em tempo real de termos que o usuário precisa aceitar
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarTermosPendentes, temTermosPendentes } from '@/services/aceitesService';
import type { TermosPendentes, TermoParaExibicao } from '@/types/termos';

interface UseTermosPendentesReturn {
  termosPendentes: TermoParaExibicao[];
  totalPendentes: number;
  todosAceitos: boolean;
  loading: boolean;
  error: string | null;
  verificar: () => Promise<void>;
  verificarRapido: () => Promise<boolean>;
}

/**
 * Hook para monitorar termos pendentes de aceite
 * 
 * @param autoCheck - Verificar automaticamente ao montar (default: true)
 * @param interval - Intervalo de verificação automática em ms (default: null = sem auto-refresh)
 * 
 * @example
 * ```tsx
 * function TermosGuard() {
 *   const { termosPendentes, todosAceitos, loading } = useTermosPendentes();
 *   
 *   if (loading) return <Loading />;
 *   
 *   if (!todosAceitos) {
 *     return <TermosModal termos={termosPendentes} />;
 *   }
 *   
 *   return <Dashboard />;
 * }
 * ```
 */
export function useTermosPendentes(
  autoCheck: boolean = true,
  interval: number | null = null
): UseTermosPendentesReturn {
  const { user } = useAuth();
  const [termosPendentes, setTermosPendentes] = useState<TermoParaExibicao[]>([]);
  const [totalPendentes, setTotalPendentes] = useState<number>(0);
  const [todosAceitos, setTodosAceitos] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(autoCheck);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verifica termos pendentes (completo)
   * Busca todos os dados dos termos
   */
  const verificar = useCallback(async () => {
    if (!user?.id) {
      setTermosPendentes([]);
      setTotalPendentes(0);
      setTodosAceitos(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resultado: TermosPendentes = await buscarTermosPendentes(user.id);

      setTermosPendentes(resultado.termos);
      setTotalPendentes(resultado.total);
      setTodosAceitos(resultado.todos_aceitos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar termos pendentes';
      setError(errorMessage);
      console.error('Erro em useTermosPendentes:', err);
      
      // Em caso de erro, assume que não há pendentes para não bloquear usuário
      setTermosPendentes([]);
      setTotalPendentes(0);
      setTodosAceitos(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Verificação rápida (apenas booleano)
   * Mais leve para checks frequentes
   */
  const verificarRapido = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    try {
      return await temTermosPendentes(user.id);
    } catch (err) {
      console.error('Erro em verificação rápida:', err);
      return false;
    }
  }, [user?.id]);

  // Verificação inicial
  useEffect(() => {
    if (autoCheck) {
      verificar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck]); // ✅ Remover 'verificar' para evitar loop

  // Verificação periódica (polling)
  useEffect(() => {
    if (!interval || interval <= 0) {
      return;
    }

    const timer = setInterval(() => {
      if (!document.hidden) { // Não verificar se aba estiver em background
        verificar();
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]); // ✅ Remover 'verificar' para evitar recriar interval

  return {
    termosPendentes,
    totalPendentes,
    todosAceitos,
    loading,
    error,
    verificar,
    verificarRapido,
  };
}

/**
 * Hook simplificado para verificação booleana rápida
 * Útil para guards e redirects
 * 
 * @example
 * ```tsx
 * function ProtectedRoute() {
 *   const { temPendentes, loading } = useHasTermosPendentes();
 *   
 *   if (loading) return <Loading />;
 *   
 *   if (temPendentes) {
 *     return <Navigate to="/aceitar-termos" />;
 *   }
 *   
 *   return <Outlet />;
 * }
 * ```
 */
export function useHasTermosPendentes(autoCheck: boolean = true) {
  const { user } = useAuth();
  const [temPendentes, setTemPendentes] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(autoCheck);

  const verificar = useCallback(async () => {
    if (!user?.id) {
      setTemPendentes(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const resultado = await temTermosPendentes(user.id);
      
      setTemPendentes(resultado);
    } catch (err) {
      console.error('❌ Erro ao verificar termos pendentes:', err);
      setTemPendentes(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (autoCheck) {
      verificar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck, user?.id]); // ✅ CORRIGIDO: user?.id ao invés de verificar

  return {
    temPendentes,
    loading,
    verificar,
  };
}

/**
 * Hook para monitorar termo específico
 * Útil para verificar se usuário já aceitou um termo individual
 * 
 * @example
 * ```tsx
 * function ConteudoRestrito() {
 *   const { aceito, loading } = useTermoAceito(TERMO_LGPD_ID);
 *   
 *   if (loading) return <Loading />;
 *   
 *   if (!aceito) {
 *     return <MensagemAceitarLGPD />;
 *   }
 *   
 *   return <ConteudoSensivel />;
 * }
 * ```
 */
export function useTermoAceito(termoId: string | null) {
  const { user } = useAuth();
  const [aceito, setAceito] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!termoId);

  useEffect(() => {
    if (!termoId || !user?.id) {
      setAceito(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function verificarAceite() {
      try {
        setLoading(true);
        
        // Buscar todos os termos pendentes e verificar se o termo está na lista
        const resultado = await buscarTermosPendentes(user!.id);
        const estaPendente = resultado.termos.some(t => t.id === termoId);
        
        if (!cancelled) {
          setAceito(!estaPendente);
        }
      } catch (err) {
        console.error('Erro ao verificar aceite:', err);
        if (!cancelled) {
          setAceito(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verificarAceite();

    return () => {
      cancelled = true;
    };
  }, [termoId, user?.id]);

  return { aceito, loading };
}
