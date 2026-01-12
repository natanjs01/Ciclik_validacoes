import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { getAssetPath } from '@/utils/assetPath';

export default function EmailConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Supabase usa hash fragments (#) em vez de query params (?)
      // Exemplo: /auth/confirm#access_token=xxx&type=signup&...
      
      let params: URLSearchParams;
      
      // Verificar se há hash fragment
      if (window.location.hash) {
        // Remove o # e cria URLSearchParams
        const hashParams = window.location.hash.substring(1);
        params = new URLSearchParams(hashParams);
      } else {
        // Fallback para query params normais
        params = searchParams;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');// Se não há tokens, significa que o usuário acabou de se cadastrar
      if (!accessToken || !refreshToken || type !== 'signup') {setStatus('pending');
        setMessage('Verifique seu email para confirmar seu cadastro.');
        return;
      }

      try {// Usar setSession para autenticar com os tokens do email
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('❌ [EMAIL-CONFIRM] Erro na confirmação:', error);
          setStatus('error');
          setMessage('Erro ao confirmar email. O link pode ter expirado.');
          return;
        }

        if (data.user) {setStatus('success');
          setMessage('Email confirmado com sucesso! Você já pode fazer login.');
          
          // NÃO redireciona automaticamente - usuário decide quando sair
          // O redirecionamento só acontece quando clicar no botão "Ir para Login"
        }
      } catch (error) {
        console.error('❌ [EMAIL-CONFIRM] Erro inesperado:', error);
        setStatus('error');
        setMessage('Erro ao confirmar email. Por favor, tente novamente.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
            <CardTitle className="text-2xl text-center mb-2">
              Confirmando email...
            </CardTitle>
            <CardDescription className="text-center">
              Aguarde enquanto confirmamos seu cadastro.
            </CardDescription>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-center mb-2">
              ✅ Email Confirmado!
            </CardTitle>
            <CardDescription className="text-center mb-4">
              {message}
            </CardDescription>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 text-center">
                <strong>Parabéns!</strong> Sua conta foi ativada com sucesso. 
                Agora você pode fazer login e começar a usar a plataforma.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Ir para o Login
            </Button>
          </>
        );

      case 'error':
        return (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-center mb-2">
              Erro na Confirmação
            </CardTitle>
            <CardDescription className="text-center mb-4">
              {message}
            </CardDescription>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Voltar para Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </div>
          </>
        );

      case 'pending':
        return (
          <>
            <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl text-center mb-2">
              Verifique seu Email
            </CardTitle>
            <CardDescription className="text-center mb-4">
              Enviamos um link de confirmação para seu email. 
              Clique no link para ativar sua conta.
            </CardDescription>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Verifique também sua caixa de spam ou lixo eletrônico.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth')} 
              variant="outline"
              className="w-full"
            >
              Voltar para Login
            </Button>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src={getAssetPath('ciclik-logo-full.png')}
              alt="Ciclik - Recicle e Ganhe" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
