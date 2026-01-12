import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar role do usuário', error);
      return null;
    }

    // Se não houver roles, retorna null
    if (!data || data.length === 0) {
      return null;
    }

    // Se tiver apenas uma role, retorna ela
    if (data.length === 1) {
      return data[0].role;
    }

    // Se tiver múltiplas roles, priorizar nesta ordem:
    // admin > investidor > cooperativa > empresa > vendedor > usuario
    const rolePriority = ['admin', 'investidor', 'cooperativa', 'empresa', 'vendedor', 'usuario'];
    
    for (const priorityRole of rolePriority) {
      if (data.some((r: any) => r.role === priorityRole)) {
        return priorityRole;
      }
    }

    // Fallback: retorna a primeira role encontrada
    return data[0].role;
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil do usuário', error);
      return null;
    }

    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Track if we've already loaded user data to avoid unnecessary reloads
    let hasLoadedInitialData = false;
    let currentUserId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Only handle actual auth changes, not token refreshes or focus events
        const isActualAuthChange = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED';
        const isNewUser = newSession?.user?.id !== currentUserId;
        
        // Update session state without causing full reload
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Only reload data on actual auth changes, new user, or if we haven't loaded yet
          const shouldReloadData = isActualAuthChange || isNewUser || !hasLoadedInitialData;
          
          if (shouldReloadData) {
            const isFirstLoad = !hasLoadedInitialData;
            hasLoadedInitialData = true;
            currentUserId = newSession.user.id;
            
            // Only show loading spinner on first load
            if (isFirstLoad) {
              setLoading(true);
            }
            
            // Defer backend calls to avoid deadlocks
            setTimeout(async () => {
              try {
                const [role, profileData] = await Promise.all([
                  fetchUserRole(newSession.user.id),
                  fetchProfile(newSession.user.id)
                ]);
                setUserRole(role);
                setProfile(profileData);
              } catch (error) {
                console.error('Erro ao carregar dados de autenticação (onAuthStateChange)', error);
              } finally {
                setLoading(false);
              }
            }, 0);
          }
        } else {
          hasLoadedInitialData = false;
          currentUserId = null;
          setUserRole(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Buscar sessão existente na inicialização
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        try {
          const [role, profileData] = await Promise.all([
            fetchUserRole(currentSession.user.id),
            fetchProfile(currentSession.user.id)
          ]);
          setUserRole(role);
          setProfile(profileData);
        } catch (error) {
          console.error('Erro ao carregar dados de autenticação (getSession)', error);
        } finally {
          // Garantir que o loading só seja desativado após carregar role e profile
          setLoading(false);
        }
      } else {
        // Se não houver usuário, pode desativar o loading imediatamente
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('🚪 [LOGOUT] Iniciando processo de logout...');
      
      // Primeiro limpar o estado local antes de tentar fazer logout no servidor
      console.log('🧹 [LOGOUT] Limpando estado local...');
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      
      // Tentar fazer logout no servidor
      console.log('🌐 [LOGOUT] Tentando logout no servidor Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [LOGOUT] Erro ao fazer logout no servidor:', error);
        // Mesmo com erro no servidor, limpar o storage local
        console.log('🗑️ [LOGOUT] Limpando storage local manualmente...');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } else {
        console.log('✅ [LOGOUT] Logout no servidor bem-sucedido');
      }
      
      // Redirecionar para a página de login
      console.log('↩️ [LOGOUT] Redirecionando para /auth...');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('💥 [LOGOUT] Erro crítico ao fazer logout:', error);
      // Forçar limpeza e redirecionamento mesmo com erro
      console.log('🔧 [LOGOUT] Forçando limpeza de emergência...');
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      navigate('/auth', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}