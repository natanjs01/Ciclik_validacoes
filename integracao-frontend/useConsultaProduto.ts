// ============================================================
// 🪝 HOOK REACT: useConsultaProduto
// ============================================================
// Arquivo: src/hooks/useConsultaProduto.ts
// Descrição: Hook para gerenciar estado de consulta à API Cosmos

import { useState } from 'react';
import { 
  consultarProdutoComCache, 
  type ProdutoCosmosResponse 
} from '../services/cosmosApi';

interface UseConsultaProdutoReturn {
  dados: ProdutoCosmosResponse | null;
  loading: boolean;
  error: string | null;
  consultar: (gtin: string) => Promise<void>;
  limpar: () => void;
}

/**
 * Hook para consultar produtos na API Cosmos
 * 
 * @example
 * ```tsx
 * const { dados, loading, error, consultar } = useConsultaProduto();
 * 
 * async function handleBuscar() {
 *   await consultar('7891910000197');
 *   if (dados) {
 *     console.log('Categoria:', dados.categoria_api);
 *   }
 * }
 * ```
 */
export function useConsultaProduto(): UseConsultaProdutoReturn {
  const [dados, setDados] = useState<ProdutoCosmosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Consulta produto por GTIN
   */
  async function consultar(gtin: string): Promise<void> {
    // Reset estado anterior
    setLoading(true);
    setError(null);
    setDados(null);

    try {
      const resultado = await consultarProdutoComCache(gtin);
      
      if (!resultado) {
        setError('Produto não encontrado na base Cosmos');
        return;
      }

      setDados(resultado);

    } catch (err) {
      const mensagem = err instanceof Error 
        ? err.message 
        : 'Erro desconhecido ao consultar produto';
      
      setError(mensagem);
      console.error('[useConsultaProduto] Erro:', err);

    } finally {
      setLoading(false);
    }
  }

  /**
   * Limpa estado (útil ao sair da tela)
   */
  function limpar(): void {
    setDados(null);
    setError(null);
    setLoading(false);
  }

  return {
    dados,
    loading,
    error,
    consultar,
    limpar
  };
}
