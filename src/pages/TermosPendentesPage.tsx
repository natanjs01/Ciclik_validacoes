/**
 * Página de Aceite de Termos Pendentes
 * Exibida quando o usuário tem termos para aceitar
 */

import { useNavigate } from 'react-router-dom';
import { useTermosPendentes } from '@/hooks/useTermosPendentes';
import { useRegistrarAceite } from '@/hooks/useRegistrarAceite';
import { TermosModal } from '@/components/termos';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Página exibida quando há termos pendentes
 * Bloqueia acesso até aceite completo
 */
export default function TermosPendentesPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { termosPendentes, loading, todosAceitos } = useTermosPendentes();
  const { registrar, loading: registrando, error } = useRegistrarAceite({
    onSucesso: () => {
      // Redirecionar para dashboard após aceite
      navigate('/', { replace: true });
    },
  });

  /**
   * Processa aceite de múltiplos termos
   */
  const handleAceitar = async (termosIds: string[]) => {
    if (termosIds.length === 0) return;
    await registrar(termosIds);
  };

  /**
   * Fazer logout (cancelar aceite)
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando termos de uso...
          </p>
        </div>
      </div>
    );
  }

  // Se não há termos pendentes, redirecionar
  if (todosAceitos || termosPendentes.length === 0) {
    navigate('/', { replace: true });
    return null;
  }

  // Renderizar modal de aceite
  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold text-lg">Ciclik</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={registrando}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="pt-16">
        <TermosModal
          termos={termosPendentes}
          onAceitar={handleAceitar}
          onLogout={handleLogout}
          loading={registrando}
          error={error}
        />
      </div>
    </div>
  );
}
