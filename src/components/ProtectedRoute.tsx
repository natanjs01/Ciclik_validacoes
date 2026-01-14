import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();

  // Se está carregando E não tem usuário ainda, mostra spinner
  // (primeira carga, antes de saber se está autenticado)
  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está carregando E não tem usuário, redireciona para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se tem usuário mas role não está na lista permitida, redireciona para home
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Se tem usuário, renderiza o conteúdo (mesmo se loading=true para role/profile)
  return <>{children}</>;
}