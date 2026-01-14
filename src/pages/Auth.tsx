import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Loader2, Eye, EyeOff, HelpCircle, Check, X, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/lib/validators';
import { appUrl } from '@/lib/appUrl';
import { getAssetPath } from '@/utils/assetPath';
import { useAuth } from '@/contexts/AuthContext';

const signupSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  tipo_pessoa: z.enum(['PF', 'PJ']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  tipo_pj: z.string().optional(),
  cep: z.string().min(8, 'CEP inválido'),
  codigo_indicador: z.string().trim().toUpperCase().max(8).optional().or(z.literal('')),
});

// Função para calcular força da senha
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 25, label: 'Fraca', color: 'bg-destructive' };
  if (score <= 4) return { score: 50, label: 'Média', color: 'bg-yellow-500' };
  if (score <= 5) return { score: 75, label: 'Boa', color: 'bg-blue-500' };
  return { score: 100, label: 'Forte', color: 'bg-green-500' };
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');
  const [showPassword, setShowPassword] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    cpf: '',
    cnpj: '',
    tipo_pj: '',
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero: '',
    complemento: '',
    codigo_indicador: '',
  });

  // Redirecionar usuários já autenticados
  useEffect(() => {
    // Adicionar um pequeno delay para evitar loop durante o logout
    const timer = setTimeout(() => {
      if (user && !processingInvite) {
        navigate('/');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user, navigate, processingInvite]);

  // Processar tokens de convite/magic link na URL
  useEffect(() => {
    const processAuthTokens = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const isInvited = searchParams.get('invited') === 'true';

      // Se temos tokens na URL (de invite ou magic link)
      if (accessToken && (type === 'invite' || type === 'magiclink' || type === 'signup')) {
        setProcessingInvite(true);
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Erro ao estabelecer sessão:', error);
            toast({
              title: 'Erro no convite',
              description: 'Não foi possível processar o convite. Tente novamente.',
              variant: 'destructive',
            });
            setProcessingInvite(false);
            return;
          }

          if (data.session) {
            // Verificar role do usuário
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', data.session.user.id);

            const isInvestor = roles?.some(r => r.role === 'investidor');
            
            if (isInvestor) {
              // Investidor: redirecionar para dashboard
              toast({
                title: 'Bem-vindo!',
                description: 'Você está logado como investidor.',
              });
              navigate('/');
            } else {
              // Usuário comum
              navigate('/');
            }
          }
        } catch (err) {
          console.error('Erro ao processar convite:', err);
          setProcessingInvite(false);
        }
        return;
      }

      // Se veio do convite mas sem token ainda, mostrar mensagem
      if (isInvited) {
        setIsInvitedUser(true);
      }

      // Capturar código de indicação da URL
      const refCode = searchParams.get('ref');
      if (refCode) {
        setFormData(prev => ({ ...prev, codigo_indicador: refCode.toUpperCase() }));
        toast({
          title: 'Código de indicação detectado!',
          description: `Você está sendo indicado com o código: ${refCode.toUpperCase()}`,
        });
      }
    };

    processAuthTokens();
  }, [searchParams, navigate, toast]);

  const fetchCEP = async (cep: string) => {
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      if (cleanCEP.length !== 8) return;

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar confirmação de senha
      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      const validatedData = signupSchema.parse({
        ...formData,
        tipo_pessoa: tipoPessoa,
      });

      if (tipoPessoa === 'PF') {
        if (!formData.cpf) throw new Error('CPF é obrigatório para Pessoa Física');
        if (!validateCPF(formData.cpf)) throw new Error('CPF inválido');
      }
      if (tipoPessoa === 'PJ') {
        if (!formData.cnpj) throw new Error('CNPJ é obrigatório para Pessoa Jurídica');
        if (!validateCNPJ(formData.cnpj)) throw new Error('CNPJ inválido');
        if (!formData.tipo_pj) throw new Error('Tipo de PJ é obrigatório');
      }
      
      // 1. Criar usuário no auth.users com TODOS os dados no raw_user_meta_data
      // O trigger handle_new_user irá criar automaticamente o profile e role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: appUrl('/auth/confirm'),
          data: {
            nome: validatedData.nome,
            email: validatedData.email,
            telefone: validatedData.telefone,
            tipo_pessoa: tipoPessoa,
            cpf: tipoPessoa === 'PF' ? formData.cpf : null,
            cnpj: tipoPessoa === 'PJ' ? formData.cnpj : null,
            tipo_pj: tipoPessoa === 'PJ' ? formData.tipo_pj : null,
            cep: validatedData.cep,
            logradouro: formData.logradouro || null,
            bairro: formData.bairro || null,
            cidade: formData.cidade || null,
            uf: formData.uf || null,
            numero: formData.numero || null,
            complemento: formData.complemento || null,
            codigo_indicador: formData.codigo_indicador || null,
            role: 'usuario'
          }
        }
      });

      if (authError) {
        console.error('❌ [CADASTRO] Erro ao criar usuário:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      toast({
        title: '📧 Verifique seu Email!',
        description: `Cadastro realizado! Enviamos um link de confirmação para ${validatedData.email}. Confirme seu email para fazer login.`,
      });
      
      // Redireciona para página de confirmação pendente
      navigate('/auth/confirm');
    } catch (error: any) {
      console.error('💥 [CADASTRO] Erro capturado:', error);
      
      const errorMessage = error.message === 'User already registered' 
        ? 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
        : error.message;
      
      toast({
        title: 'Erro no cadastro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      // Verificar se o email foi confirmado
      if (data.user && !data.user.email_confirmed_at) {
        
        // Verificar se é admin (admin pode logar sem confirmar)
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');

        if (!isAdmin) {
          // Fazer logout imediatamente
          await supabase.auth.signOut();
          
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada e spam.');
        }
      }

      // Verificar role do usuário para redirecionar corretamente
      if (data.session) {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id);

        if (rolesError) {
          console.error('Erro ao buscar roles:', rolesError);
        }

        // Deixar o RoleBasedRedirect fazer o redirecionamento
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      toast({
        title: 'Erro no login',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Se está processando convite, mostrar loading
  if (processingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl rounded-3xl border-0 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Processando seu acesso...</p>
            <p className="text-sm text-muted-foreground text-center">
              Aguarde enquanto configuramos sua conta.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Botão Voltar - Fixo no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Força scroll para esconder barra do navegador antes de navegar
            window.scrollTo(0, 1);
            setTimeout(() => {
              window.scrollTo(0, 0);
              navigate('/apresentacao');
            }, 10);
          }}
          className="font-display font-medium bg-white/90 backdrop-blur-sm hover:bg-white shadow-md rounded-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl rounded-3xl border-0 overflow-hidden">
        {/* Logo Header */}
        <div className="pt-8 pb-6 px-6">
          <div className="flex justify-center">
            <img 
              src={getAssetPath('ciclik-logo-full.png')}
              alt="Ciclik - Recicle e Ganhe" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Recicle, acumule pontos e ganhe prêmios
          </p>
        </div>
        
        <CardContent className="p-6 pt-4">
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-xl bg-muted/50">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
                Cadastrar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="email"
                    className="h-12 rounded-xl bg-muted/30 border-muted focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      autoComplete="current-password"
                      className="h-12 pr-12 rounded-xl bg-muted/30 border-muted focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-10 w-10 rounded-lg hover:bg-muted"
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
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80 block text-right font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0ms' }}>
                  <Label>Tipo de Pessoa</Label>
                  <Select value={tipoPessoa} onValueChange={(v: 'PF' | 'PJ') => setTipoPessoa(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipoPessoa === 'PJ' && (
                  <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
                    <Label>Tipo de Empresa</Label>
                    <Select value={formData.tipo_pj} onValueChange={(v) => setFormData({ ...formData, tipo_pj: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Condominio">Condomínio</SelectItem>
                        <SelectItem value="Restaurante">Restaurante</SelectItem>
                        <SelectItem value="Comercio">Comércio</SelectItem>
                        <SelectItem value="Servico">Serviço</SelectItem>
                        <SelectItem value="Industria">Indústria</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
                  <Label>Nome {tipoPessoa === 'PJ' && 'da Empresa'}</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center gap-1.5">
                    <Label>Email</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" tabIndex={-1}>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-center">
                          <p>Usamos seu email para validar sua conta e enviar informações importantes sobre suas entregas e pontos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <Label>Senha (mínimo 6 caracteres)</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  {formData.password && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Força da senha:</span>
                        <span className={`font-medium ${
                          calculatePasswordStrength(formData.password).label === 'Fraca' ? 'text-destructive' :
                          calculatePasswordStrength(formData.password).label === 'Média' ? 'text-yellow-600' :
                          calculatePasswordStrength(formData.password).label === 'Boa' ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {calculatePasswordStrength(formData.password).label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${calculatePasswordStrength(formData.password).color}`}
                          style={{ width: `${calculatePasswordStrength(formData.password).score}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {formData.password.length >= 6 ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-destructive" />
                          )}
                          <span>Mínimo 6 caracteres</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[A-Z]/.test(formData.password) ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/50" />
                          )}
                          <span>Letra maiúscula</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[0-9]/.test(formData.password) ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/50" />
                          )}
                          <span>Número</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[^a-zA-Z0-9]/.test(formData.password) ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground/50" />
                          )}
                          <span>Caractere especial</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <Label>Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Digite a senha novamente"
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
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      As senhas não coincidem
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Senhas coincidem
                    </p>
                  )}
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
                  <div className="flex items-center gap-1.5">
                    <Label>Telefone</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" tabIndex={-1}>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-center">
                          <p>Não enviamos propaganda. Seu telefone é usado apenas para identificação nas entregas de recicláveis.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({ ...formData, telefone: formatted });
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center gap-1.5">
                    <Label>{tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                    {tipoPessoa === 'PF' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button" tabIndex={-1}>
                            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px] text-center">
                            <p>Pedimos seu CPF para garantir que seus benefícios e cashback vão diretamente para você, com segurança.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Input
                    value={tipoPessoa === 'PF' ? formData.cpf : formData.cnpj}
                    onChange={(e) => {
                      const field = tipoPessoa === 'PF' ? 'cpf' : 'cnpj';
                      const formatted = tipoPessoa === 'PF' ? formatCPF(e.target.value) : formatCNPJ(e.target.value);
                      setFormData({ ...formData, [field]: formatted });
                      
                      // Validação em tempo real
                      const cleanValue = e.target.value.replace(/\D/g, '');
                      if (tipoPessoa === 'PF' && cleanValue.length === 11) {
                        setDocumentError(validateCPF(e.target.value) ? '' : 'CPF inválido');
                      } else if (tipoPessoa === 'PJ' && cleanValue.length === 14) {
                        setDocumentError(validateCNPJ(e.target.value) ? '' : 'CNPJ inválido');
                      } else {
                        setDocumentError('');
                      }
                    }}
                    maxLength={tipoPessoa === 'PF' ? 14 : 18}
                    className={documentError ? 'border-destructive' : ''}
                    required
                  />
                  {documentError && (
                    <p className="text-sm text-destructive">{documentError}</p>
                  )}
                </div>

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '350ms' }}>
                  <div className="flex items-center gap-1.5">
                    <Label>CEP</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" tabIndex={-1}>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-center">
                          <p>Usamos seu CEP para encontrar o operador logístico mais próximo para suas entregas de recicláveis.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    value={formData.cep}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value);
                      setFormData({ ...formData, cep: formatted });
                      if (e.target.value.replace(/\D/g, '').length === 8) {
                        fetchCEP(e.target.value);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>

                {formData.logradouro && (
                  <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={formData.cidade} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>UF</Label>
                        <Input value={formData.uf} disabled />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label>Logradouro</Label>
                      <Input value={formData.logradouro} disabled />
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label>Bairro</Label>
                      <Input value={formData.bairro} disabled />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input
                          value={formData.complemento}
                          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 animate-fade-in" style={{ animationDelay: '450ms' }}>
                  <Label>Código de Indicação (opcional)</Label>
                  <Input
                    value={formData.codigo_indicador}
                    onChange={(e) => setFormData({ ...formData, codigo_indicador: e.target.value.toUpperCase() })}
                    placeholder="Ex: ABC12345"
                    maxLength={8}
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tem um código de indicação? Insira aqui para você e seu amigo ganharem pontos!
                  </p>
                </div>

                <Button type="submit" className="w-full animate-fade-in" style={{ animationDelay: '500ms' }} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}