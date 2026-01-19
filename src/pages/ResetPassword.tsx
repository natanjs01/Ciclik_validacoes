import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processTokens = async () => {
      // Verificar se há tokens na URL (hash ou query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      // Tokens podem vir do hash (#) ou da query (?)
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
      const type = hashParams.get('type') || queryParams.get('type');

      // 🔍 LOG TEMPORÁRIO PARA DIAGNÓSTICO DE LINK EXPIRADO
      console.log('=== DIAGNÓSTICO DE LINK DE RECUPERAÇÃO ===');
      console.log('URL completa:', window.location.href);
      console.log('Hash params:', window.location.hash);
      console.log('Query params:', window.location.search);
      console.log('Type:', type);
      console.log('Tem access_token?:', !!accessToken);
      console.log('Tem refresh_token?:', !!refreshToken);
      if (accessToken) {
        console.log('Access token (primeiros 50 chars):', accessToken.substring(0, 50) + '...');
      }
      console.log('==========================================');

      // Se temos tokens de recovery, estabelecer sessão manualmente
      if (accessToken && type === 'recovery') {
        console.log('✅ Tokens de recovery detectados - processando...');
        console.log('🔄 Estabelecendo nova sessão com token de recovery...');
        
        try {
          // � DIAGNÓSTICO: Verificar se havia sessão ativa antes do recovery
          const { data: sessionBefore } = await supabase.auth.getSession();
          if (sessionBefore.session) {
            console.log('⚠️ HAVIA SESSÃO ATIVA ANTES DO RECOVERY!');
            console.log('   Usuário logado:', sessionBefore.session.user.email);
            console.log('   User ID:', sessionBefore.session.user.id);
            console.log('   Sessão expira em:', new Date(sessionBefore.session.expires_at! * 1000).toLocaleString());
          } else {
            console.log('✅ Nenhuma sessão ativa encontrada - tudo OK');
          }
          
          // �🔧 SOLUÇÃO DEFINITIVA: Usar setSession DIRETAMENTE sem fazer signOut
          // O setSession substitui automaticamente qualquer sessão existente
          // Fazer signOut (mesmo local) invalida tokens no servidor
          console.log('🔐 Substituindo sessão atual pela sessão de recovery...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
        
          if (error) {
            console.error('❌ ERRO ao estabelecer sessão:', error);
            console.error('Tipo do erro:', error.name);
            console.error('Mensagem:', error.message);
            console.error('Status:', error.status);
            console.error('Detalhes completos:', JSON.stringify(error, null, 2));
            toast({
              title: 'Erro',
              description: 'Link de recuperação inválido ou expirado.',
              variant: 'destructive',
            });
            setSessionReady(false);
          } else if (data.session) {
            console.log('✅ Sessão estabelecida com SUCESSO!');
            console.log('Email do usuário:', data.session.user.email);
            console.log('User ID:', data.session.user.id);
            setSessionReady(true);
          } else {
            console.warn('⚠️ SetSession retornou sem erro, mas sem sessão');
            setSessionReady(false);
          }
        } catch (err) {
          console.error('❌ Erro inesperado ao processar token:', err);
          toast({
            title: 'Erro',
            description: 'Não foi possível processar o link de recuperação.',
            variant: 'destructive',
          });
          setSessionReady(false);
        }
        
        setCheckingSession(false);
        return;
      }

      console.log('ℹ️ Não há tokens de recovery na URL - verificando outras formas de autenticação...');

      // Escutar eventos de autenticação para detectar quando a sessão está pronta
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setSessionReady(true);
            setCheckingSession(false);
          } else if (event === 'SIGNED_OUT') {
            setSessionReady(false);
          }
        }
      );

      // Verificar se já existe uma sessão
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);

      return () => subscription.unsubscribe();
    };

    processTokens();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 🔐 Log de segurança: Verificar qual usuário terá a senha alterada
      const { data: { session } } = await supabase.auth.getSession();const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;toast({
        title: 'Senha definida com sucesso!',
        description: 'Você será redirecionado para a página de login.',
      });

      // Fazer logout após trocar a senha para garantir que o usuário faça login novamente
      await supabase.auth.signOut();

      // Redirecionar para a página de autenticação após sucesso
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao definir senha:', error);
      toast({
        title: 'Erro ao definir senha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica a sessão
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando seu acesso...</p>
        </div>
      </div>
    );
  }

  // Se não há sessão válida, mostrar erro
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Link Inválido ou Expirado
            </CardTitle>
            <CardDescription className="text-center">
              Este link de acesso não é mais válido. Solicite um novo convite ao administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/auth')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-green-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Bem-vindo ao Ciclik!
          </CardTitle>
          <CardDescription className="text-center">
            Defina sua senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Definir Senha e Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
