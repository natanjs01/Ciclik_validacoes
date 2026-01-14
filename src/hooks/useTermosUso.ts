/**
 * Hook para gerenciar termos de uso ativos
 * Busca, cache e atualização de termos aplicáveis ao usuário
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarTermosAtivos, buscarTermoPorId, buscarVersaoMaisRecente } from '@/services/termosUsoService';
import type { TermoUso, TipoTermo } from '@/types/termos';

interface UseTermosUsoReturn {
  termos: TermoUso[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  buscarPorId: (id: string) => Promise<TermoUso | null>;
  buscarUltimaVersao: (tipo: TipoTermo) => Promise<TermoUso | null>;
}

/**
 * Hook para buscar termos de uso ativos
 * 
 * @param tipo - Filtrar por tipo específico (opcional)
 * @param autoLoad - Carregar automaticamente ao montar (default: true)
 * 
 * @example
 * ```tsx
 * function MeuComponente() {
 *   const { termos, loading, error, refetch } = useTermosUso();
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return (
 *     <div>
 *       {termos.map(termo => (
 *         <div key={termo.id}>{termo.titulo}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTermosUso(
  tipo?: TipoTermo,
  autoLoad: boolean = true
): UseTermosUsoReturn {
  const { user } = useAuth();
  const [termos, setTermos] = useState<TermoUso[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca termos ativos do servidor
   */
  const fetchTermos = useCallback(async () => {
    if (!user?.id) {
      setTermos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await buscarTermosAtivos(user.id, tipo);
      setTermos(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar termos';
      setError(errorMessage);
      console.error('Erro em useTermosUso:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, tipo]);

  /**
   * Busca um termo específico por ID
   */
  const buscarPorId = useCallback(async (id: string): Promise<TermoUso | null> => {
    try {
      return await buscarTermoPorId(id);
    } catch (err) {
      console.error('Erro ao buscar termo por ID:', err);
      return null;
    }
  }, []);

  /**
   * Busca a última versão ativa de um tipo
   */
  const buscarUltimaVersao = useCallback(async (tipoTermo: TipoTermo): Promise<TermoUso | null> => {
    try {
      return await buscarVersaoMaisRecente(tipoTermo);
    } catch (err) {
      console.error('Erro ao buscar última versão:', err);
      return null;
    }
  }, []);

  /**
   * Recarrega os termos
   */
  const refetch = useCallback(async () => {
    await fetchTermos();
  }, [fetchTermos]);

  // Carrega termos automaticamente se autoLoad = true
  useEffect(() => {
    if (autoLoad) {
      fetchTermos();
    }
  }, [autoLoad, fetchTermos]);

  return {
    termos,
    loading,
    error,
    refetch,
    buscarPorId,
    buscarUltimaVersao,
  };
}

/**
 * Hook simplificado para buscar um termo específico
 * 
 * @example
 * ```tsx
 * function DetalhesTermo({ termoId }: { termoId: string }) {
 *   const { termo, loading, error } = useTermoPorId(termoId);
 *   
 *   if (loading) return <Loading />;
 *   if (error || !termo) return <Error />;
 *   
 *   return <div>{termo.titulo}</div>;
 * }
 * ```
 */
export function useTermoPorId(termoId: string | null) {
  const [termo, setTermo] = useState<TermoUso | null>(null);
  const [loading, setLoading] = useState<boolean>(!!termoId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!termoId) {
      setTermo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTermo() {
      try {
        setLoading(true);
        setError(null);

        const data = await buscarTermoPorId(termoId);
        
        if (!cancelled) {
          setTermo(data);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar termo';
          setError(errorMessage);
          console.error('Erro em useTermoPorId:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTermo();

    return () => {
      cancelled = true;
    };
  }, [termoId]);

  return { termo, loading, error };
}
