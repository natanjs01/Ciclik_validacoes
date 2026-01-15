import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHasTermosPendentes } from '@/hooks/useTermosPendentes';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  /**
   * Se true, pula verificação de termos pendentes
   * Use apenas para rotas que não devem ser bloqueadas (ex: /termos-pendentes)
   */
  skipTermosCheck?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  skipTermosCheck = false 
}: ProtectedRouteProps) {
  const { user, userRole, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // SEMPRE verificar termos (autoCheck=true) - a decisão de aplicar o bloqueio é feita depois
  const { temPendentes, loading: termosLoading } = useHasTermosPendentes(true);

  // Se está carregando autenticação E não tem usuário ainda, mostra spinner
  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se tem usuário mas role não está na lista permitida, redireciona para home
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // VERIFICAÇÃO DE TERMOS PENDENTES
  // Admin nunca é bloqueado por termos
  // Página /termos-pendentes também não é bloqueada (senão cria loop)
  const isAdmin = userRole === 'admin';
  const isTermosPage = location.pathname === '/termos-pendentes';
  
  if (!skipTermosCheck && !isAdmin && !isTermosPage) {
    // Se ainda está carregando verificação de termos, mostra loading
    if (termosLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Verificando termos de uso...</p>
          </div>
        </div>
      );
    }

    // Se tem termos pendentes, redireciona para página de aceite
    if (temPendentes) {
      return <Navigate to="/termos-pendentes" replace />;
    }
  }

  // Tudo ok: autenticado, role correto, sem termos pendentes
  return <>{children}</>;
}