/**
 * Hook para registrar aceites de termos
 * Gerencia loading, erro e sucesso do processo de aceite
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { registrarAceites, registrarAceite } from '@/services/aceitesService';

interface UseRegistrarAceiteReturn {
  registrar: (termosIds: string[]) => Promise<boolean>;
  registrarUnico: (termoId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  sucesso: boolean;
  resetar: () => void;
}

/**
 * Hook para registrar aceite de termos
 * Captura automaticamente IP e User Agent
 * 
 * @param onSucesso - Callback executado após aceite bem-sucedido
 * @param onErro - Callback executado em caso de erro
 * 
 * @example
 * ```tsx
 * function TermosModal({ termos }) {
 *   const { registrar, loading, error, sucesso } = useRegistrarAceite({
 *     onSucesso: () => {
 *       toast.success('Termos aceitos com sucesso!');
 *       navigate('/dashboard');
 *     }
 *   });
 *   
 *   const handleAceitar = async () => {
 *     const ids = termos.map(t => t.id);
 *     await registrar(ids);
 *   };
 *   
 *   return (
 *     <div>
 *       <Button onClick={handleAceitar} disabled={loading}>
 *         {loading ? 'Processando...' : 'Aceitar Termos'}
 *       </Button>
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistrarAceite(options?: {
  onSucesso?: () => void;
  onErro?: (error: string) => void;
}): UseRegistrarAceiteReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);

  /**
   * Registra aceite de múltiplos termos
   */
  const registrar = useCallback(
    async (termosIds: string[]): Promise<boolean> => {
      if (!user?.id) {
        const errorMsg = 'Usuário não autenticado';
        setError(errorMsg);
        options?.onErro?.(errorMsg);
        return false;
      }

      if (!termosIds || termosIds.length === 0) {
        const errorMsg = 'Nenhum termo selecionado';
        setError(errorMsg);
        options?.onErro?.(errorMsg);
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        setSucesso(false);

        // Registrar aceites
        await registrarAceites(user.id, termosIds);

        setSucesso(true);
        options?.onSucesso?.();

        console.log(`✅ ${termosIds.length} termo(s) aceito(s) com sucesso`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar aceites';
        setError(errorMessage);
        setSucesso(false);
        options?.onErro?.(errorMessage);

        console.error('Erro ao registrar aceites:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, options]
  );

  /**
   * Registra aceite de um único termo
   */
  const registrarUnico = useCallback(
    async (termoId: string): Promise<boolean> => {
      if (!user?.id) {
        const errorMsg = 'Usuário não autenticado';
        setError(errorMsg);
        options?.onErro?.(errorMsg);
        return false;
      }

      if (!termoId) {
        const errorMsg = 'ID do termo não fornecido';
        setError(errorMsg);
        options?.onErro?.(errorMsg);
        return false;
      }

      try {
        setLoading(true);
        setError(null);
        setSucesso(false);

        // Registrar aceite único
        await registrarAceite(user.id, termoId);

        setSucesso(true);
        options?.onSucesso?.();

        console.log(`✅ Termo aceito com sucesso: ${termoId}`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar aceite';
        setError(errorMessage);
        setSucesso(false);
        options?.onErro?.(errorMessage);

        console.error('Erro ao registrar aceite:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, options]
  );

  /**
   * Reseta o estado do hook
   */
  const resetar = useCallback(() => {
    setLoading(false);
    setError(null);
    setSucesso(false);
  }, []);

  return {
    registrar,
    registrarUnico,
    loading,
    error,
    sucesso,
    resetar,
  };
}

/**
 * Hook para aceite com confirmação
 * Adiciona camada extra de confirmação antes de registrar
 * 
 * @example
 * ```tsx
 * function TermosForm() {
 *   const {
 *     registrar,
 *     loading,
 *     precisaConfirmar,
 *     confirmar,
 *     cancelar
 *   } = useAceiteComConfirmacao();
 *   
 *   const handleClick = () => {
 *     registrar(['termo-1', 'termo-2']);
 *   };
 *   
 *   return (
 *     <>
 *       <Button onClick={handleClick}>Aceitar</Button>
 *       
 *       {precisaConfirmar && (
 *         <Dialog>
 *           <p>Você confirma que leu e aceita os termos?</p>
 *           <Button onClick={confirmar}>Sim, confirmo</Button>
 *           <Button onClick={cancelar}>Cancelar</Button>
 *         </Dialog>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useAceiteComConfirmacao(options?: {
  onSucesso?: () => void;
  onErro?: (error: string) => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [precisaConfirmar, setPrecisaConfirmar] = useState<boolean>(false);
  const [termosParaAceitar, setTermosParaAceitar] = useState<string[]>([]);

  /**
   * Inicia processo de aceite (aguarda confirmação)
   */
  const registrar = useCallback((termosIds: string[]) => {
    if (!termosIds || termosIds.length === 0) {
      setError('Nenhum termo selecionado');
      return;
    }

    setTermosParaAceitar(termosIds);
    setPrecisaConfirmar(true);
    setError(null);
  }, []);

  /**
   * Confirma e executa o aceite
   */
  const confirmar = useCallback(async () => {
    if (!user?.id) {
      const errorMsg = 'Usuário não autenticado';
      setError(errorMsg);
      options?.onErro?.(errorMsg);
      setPrecisaConfirmar(false);
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setSucesso(false);
      setPrecisaConfirmar(false);

      await registrarAceites(user.id, termosParaAceitar);

      setSucesso(true);
      setTermosParaAceitar([]);
      options?.onSucesso?.();

      console.log(`✅ ${termosParaAceitar.length} termo(s) confirmado(s) e aceito(s)`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao confirmar aceites';
      setError(errorMessage);
      setSucesso(false);
      options?.onErro?.(errorMessage);

      console.error('Erro ao confirmar aceites:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, termosParaAceitar, options]);

  /**
   * Cancela o processo de aceite
   */
  const cancelar = useCallback(() => {
    setPrecisaConfirmar(false);
    setTermosParaAceitar([]);
    setError(null);
  }, []);

  /**
   * Reseta o estado
   */
  const resetar = useCallback(() => {
    setLoading(false);
    setError(null);
    setSucesso(false);
    setPrecisaConfirmar(false);
    setTermosParaAceitar([]);
  }, []);

  return {
    registrar,
    confirmar,
    cancelar,
    loading,
    error,
    sucesso,
    precisaConfirmar,
    totalTermos: termosParaAceitar.length,
    resetar,
  };
}

/**
 * Hook com retry automático
 * Tenta novamente em caso de falha
 * 
 * @example
 * ```tsx
 * function TermosCheckbox() {
 *   const { registrar, loading, tentativas } = useAceiteComRetry({
 *     maxTentativas: 3,
 *     onSucesso: () => console.log('Aceito!')
 *   });
 *   
 *   return (
 *     <Button onClick={() => registrar(['termo-1'])} disabled={loading}>
 *       Aceitar {tentativas > 0 && `(Tentativa ${tentativas})`}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAceiteComRetry(options?: {
  maxTentativas?: number;
  delayMs?: number;
  onSucesso?: () => void;
  onErro?: (error: string) => void;
  onMaxTentativasExcedido?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [tentativas, setTentativas] = useState<number>(0);

  const maxTentativas = options?.maxTentativas || 3;
  const delayMs = options?.delayMs || 1000;

  /**
   * Aguarda um período antes de tentar novamente
   */
  const aguardar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Registra aceite com retry automático
   */
  const registrar = useCallback(
    async (termosIds: string[]): Promise<boolean> => {
      if (!user?.id) {
        const errorMsg = 'Usuário não autenticado';
        setError(errorMsg);
        options?.onErro?.(errorMsg);
        return false;
      }

      setLoading(true);
      setError(null);
      setSucesso(false);
      setTentativas(0);

      for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
          setTentativas(tentativa);

          await registrarAceites(user.id, termosIds);

          setSucesso(true);
          setLoading(false);
          options?.onSucesso?.();

          console.log(`✅ Aceites registrados na tentativa ${tentativa}`);
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar aceites';
          console.error(`❌ Tentativa ${tentativa}/${maxTentativas} falhou:`, err);

          if (tentativa === maxTentativas) {
            // Última tentativa falhou
            setError(errorMessage);
            setSucesso(false);
            setLoading(false);
            options?.onErro?.(errorMessage);
            options?.onMaxTentativasExcedido?.();
            return false;
          }

          // Aguardar antes de tentar novamente
          await aguardar(delayMs * tentativa); // Backoff exponencial
        }
      }

      return false;
    },
    [user?.id, maxTentativas, delayMs, options]
  );

  return {
    registrar,
    loading,
    error,
    sucesso,
    tentativas,
  };
}
