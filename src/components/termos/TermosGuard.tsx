/**
 * Guard para Termos de Uso
 * Redireciona para aceite de termos se houver pendências
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTermosPendentes } from '@/hooks/useTermosPendentes';
import { Loader2 } from 'lucide-react';

interface TermosGuardProps {
  children: React.ReactNode;
  /**
   * Rota para onde redirecionar se houver termos pendentes
   * @default '/termos-pendentes'
   */
  redirectTo?: string;
  /**
   * Se true, não redireciona automaticamente, apenas bloqueia renderização
   */
  blockOnly?: boolean;
  /**
   * Callback quando termos pendentes são detectados
   */
  onTermosPendentes?: (quantidade: number) => void;
}

/**
 * Componente de proteção que verifica termos pendentes
 * 
 * @example
 * ```tsx
 * // Redireciona automaticamente
 * <TermosGuard>
 *   <Dashboard />
 * </TermosGuard>
 * 
 * // Apenas bloqueia sem redirecionar
 * <TermosGuard blockOnly>
 *   <ConteudoProtegido />
 * </TermosGuard>
 * 
 * // Com callback customizado
 * <TermosGuard onTermosPendentes={(qtd) => alert(`${qtd} termos pendentes`)}>
 *   <MinhaPagina />
 * </TermosGuard>
 * ```
 */
export function TermosGuard({
  children,
  redirectTo = '/termos-pendentes',
  blockOnly = false,
  onTermosPendentes,
}: TermosGuardProps) {
  const navigate = useNavigate();
  const { termosPendentes, loading, error } = useTermosPendentes();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Se houver erro, permitir acesso (fail-open para não travar o sistema)
    if (error) {
      console.error('Erro ao verificar termos pendentes:', error);
      setVerificado(true);
      return;
    }

    // Verificar se há termos pendentes
    const haTermosPendentes = termosPendentes && termosPendentes.length > 0;

    if (haTermosPendentes) {
      onTermosPendentes?.(termosPendentes.length);

      if (!blockOnly) {
        // Redirecionar para página de aceite
        navigate(redirectTo, { replace: true });
        return;
      }
    }

    // Marcar como verificado
    setVerificado(true);
  }, [
    loading,
    error,
    termosPendentes,
    navigate,
    redirectTo,
    blockOnly,
    onTermosPendentes,
  ]);

  // Mostrar loading durante verificação
  if (loading || !verificado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Verificando termos de uso...
          </p>
        </div>
      </div>
    );
  }

  // Se houver termos pendentes e for blockOnly, não renderizar children
  if (blockOnly && termosPendentes && termosPendentes.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold">Termos Pendentes</h2>
          <p className="text-muted-foreground">
            Você precisa aceitar os termos de uso para acessar esta área.
          </p>
          <p className="text-sm text-muted-foreground">
            {termosPendentes.length} termo(s) aguardando sua aceitação.
          </p>
        </div>
      </div>
    );
  }

  // Tudo ok, renderizar conteúdo
  return <>{children}</>;
}

/**
 * Hook para verificar status de termos em qualquer componente
 * 
 * @example
 * ```tsx
 * function MeuComponente() {
 *   const { temPendentes, quantidade, verificando } = useTermosStatus();
 *   
 *   if (temPendentes) {
 *     return <AlertaTermosPendentes quantidade={quantidade} />;
 *   }
 *   
 *   return <ConteudoNormal />;
 * }
 * ```
 */
export function useTermosStatus() {
  const { termosPendentes, loading } = useTermosPendentes();

  return {
    temPendentes: termosPendentes && termosPendentes.length > 0,
    quantidade: termosPendentes?.length ?? 0,
    verificando: loading,
    termos: termosPendentes ?? [],
  };
}

/**
 * Badge de notificação de termos pendentes
 * Pode ser usado em menus/navbars
 */
export function TermosPendentesBadge() {
  const { temPendentes, quantidade, verificando } = useTermosStatus();

  if (verificando || !temPendentes) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-destructive rounded-full">
      {quantidade}
    </span>
  );
}
