import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserPoints } from '@/hooks/useUserPoints';
import { formatNumber } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getAssetPath } from '@/utils/assetPath';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, 
  Trophy, 
  Gift, 
  FileText, 
  Recycle, 
  User, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Home,
  Bell,
  HelpCircle,
  GraduationCap,
  Menu
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import NotificationBell from '@/components/NotificationBell';
import PageTransition from '@/components/PageTransition';
import TourGuide from '@/components/TourGuide';
import RecyclabilityStats from '@/components/RecyclabilityStats';
import MaterialsHistory from '@/components/MaterialsHistory';
import { PendingDeliveries } from '@/components/PendingDeliveries';
import { QuickActionButton } from '@/components/QuickActionButton';
import GamificationAssistant from '@/components/GamificationAssistant';
import { useTour } from '@/hooks/useTour';
import { Step } from 'react-joyride';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 }
};

export default function UserDashboard() {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pontos: pontosCalculados, loading: pontosLoading, refetch: refetchPontos } = useUserPoints();
  const [scoreProgress, setScoreProgress] = useState(0);
  const [pesoTotalEntregue, setPesoTotalEntregue] = useState(0);
  const [deliveriesOpen, setDeliveriesOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  
  const { run, completeTour, startTour } = useTour({ 
    tourKey: 'user_dashboard',
    autoStart: true 
  });

  const tourSteps: Step[] = [
    {
      target: '.tour-profile',
      content: 'Bem-vindo ao Ciclik! Clique aqui para acessar seu perfil.',
      disableBeacon: true,
    },
    {
      target: '.tour-score-card',
      content: 'Acompanhe seus Pontos Verdes e progresso mensal!',
    },
    {
      target: '.tour-quick-actions',
      content: 'Acesse rapidamente todas as funcionalidades do app.',
    },
    {
      target: '.tour-missions',
      content: 'Complete aulas educativas para ganhar pontos verdes!',
    },
    {
      target: '.tour-deliver',
      content: 'Entregue seus recicláveis e ganhe pontos!',
    },
    {
      target: '.tour-coupons',
      content: 'Troque seus pontos por cupons de desconto.',
    },
  ];

  const handleTourCallback = () => {
    completeTour();
  };

  useEffect(() => {
    if (user) {
      loadPesoTotalEntregue();
    }
  }, [user]);

  useEffect(() => {
    calculateProgress();
  }, [pontosCalculados]);

  const calculateProgress = () => {
    const pontos = pontosCalculados;
    const nivelAtual = profile?.nivel || 'Iniciante';
    let progress = 0;
    
    if (nivelAtual === 'Iniciante' || pontos <= 500) {
      progress = (pontos / 500) * 100;
    } else if (nivelAtual === 'Ativo' || (pontos > 500 && pontos <= 1000)) {
      progress = ((pontos - 500) / 500) * 100;
    } else {
      progress = 100;
    }
    
    setScoreProgress(Math.min(progress, 100));
  };


  const loadPesoTotalEntregue = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('entregas_reciclaveis')
      .select('peso_validado')
      .eq('id_usuario', user.id)
      .eq('status', 'validada');

    if (data) {
      const total = data.reduce((sum, entrega) => sum + (entrega.peso_validado || 0), 0);
      setPesoTotalEntregue(total);
    }
  };


  const getNextLevelInfo = (pontosMes: number) => {
    if (pontosMes <= 500) {
      return {
        proximoNivel: 'Protetor Ciclik',
        pontosRestantes: 501 - pontosMes,
        metaAtual: 500
      };
    } else if (pontosMes <= 1000) {
      return {
        proximoNivel: 'Guardião Ciclik',
        pontosRestantes: 1001 - pontosMes,
        metaAtual: 1000
      };
    } else {
      return {
        proximoNivel: 'Nível Máximo',
        pontosRestantes: 0,
        metaAtual: 1001
      };
    }
  };

  const getNivelLabel = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'Embaixador Ciclik';
      case 'Ativo': return 'Protetor Ciclik';
      case 'Guardiao Verde': return 'Guardião Ciclik';
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'bg-muted text-muted-foreground';
      case 'Ativo': return 'bg-success/20 text-success';
      case 'Guardiao Verde': return 'bg-primary/20 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Componente de tooltip para Nota Fiscal
  const NotaFiscalTooltip = ({ userId, userCity, userState }: { userId?: string; userCity?: string; userState?: string }) => {
    const [registering, setRegistering] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    useEffect(() => {
      // Verificar se já registrou interesse
      const checkInterest = async () => {
        if (!userId) return;
        const { data } = await supabase
          .from('interesses_funcionalidades')
          .select('id')
          .eq('id_usuario', userId)
          .eq('funcionalidade', 'nota_fiscal')
          .maybeSingle();
        setAlreadyRegistered(!!data);
      };
      checkInterest();
    }, [userId]);

    const handleRegisterInterest = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (registering || alreadyRegistered) return;
      
      setRegistering(true);
      try {
        const { error } = await supabase
          .from('interesses_funcionalidades')
          .insert({
            id_usuario: userId || null,
            funcionalidade: 'nota_fiscal',
            estado: userState || null,
            cidade: userCity || null,
          });
        
        if (error) throw error;
        setAlreadyRegistered(true);
        toast.success('Interesse registrado! Obrigado pelo feedback.');
      } catch (error) {
        console.error('Erro ao registrar interesse:', error);
        toast.error('Erro ao registrar interesse');
      } finally {
        setRegistering(false);
      }
    };

    return (
      <div className="text-xs space-y-1.5">
        <p className="font-medium">📍 Disponível apenas na Bahia</p>
        {alreadyRegistered ? (
          <p className="text-primary">✓ Interesse registrado!</p>
        ) : (
          <button
            onClick={handleRegisterInterest}
            disabled={registering}
            className="text-primary underline hover:text-primary/80 transition-colors"
          >
            {registering ? 'Registrando...' : 'Clique aqui se deseja no seu estado'}
          </button>
        )}
      </div>
    );
  };

  // Componente de tooltip para Entregar
  const EntregarTooltip = ({ userId, userCity, userState }: { userId?: string; userCity?: string; userState?: string }) => {
    const [registering, setRegistering] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    useEffect(() => {
      const checkInterest = async () => {
        if (!userId) return;
        const { data } = await supabase
          .from('interesses_funcionalidades')
          .select('id')
          .eq('id_usuario', userId)
          .eq('funcionalidade', 'entrega_reciclaveis')
          .maybeSingle();
        setAlreadyRegistered(!!data);
      };
      checkInterest();
    }, [userId]);

    const handleRegisterInterest = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (registering || alreadyRegistered) return;
      
      setRegistering(true);
      try {
        const { error } = await supabase
          .from('interesses_funcionalidades')
          .insert({
            id_usuario: userId || null,
            funcionalidade: 'entrega_reciclaveis',
            estado: userState || null,
            cidade: userCity || null,
          });
        
        if (error) throw error;
        setAlreadyRegistered(true);
        toast.success('Interesse registrado! Obrigado pelo feedback.');
      } catch (error) {
        console.error('Erro ao registrar interesse:', error);
        toast.error('Erro ao registrar interesse');
      } finally {
        setRegistering(false);
      }
    };

    return (
      <div className="text-xs space-y-1.5">
        <p className="font-medium">📍 Disponível apenas em Salvador/BA</p>
        {alreadyRegistered ? (
          <p className="text-primary">✓ Interesse registrado!</p>
        ) : (
          <button
            onClick={handleRegisterInterest}
            disabled={registering}
            className="text-primary underline hover:text-primary/80 transition-colors"
          >
            {registering ? 'Registrando...' : 'Clique aqui se deseja na sua cidade'}
          </button>
        )}
      </div>
    );
  };

  if (!profile) return null;

  const navItems = [
    { icon: Home, label: 'Início', path: '/user', active: location.pathname === '/user' },
    { icon: GraduationCap, label: 'Educação', path: '/missions', active: location.pathname === '/missions' },
    { icon: Recycle, label: 'Entregar', path: '/select-materials', active: location.pathname === '/select-materials' },
    { icon: Gift, label: 'Cupons', path: '/redeem-coupons', active: location.pathname === '/redeem-coupons' },
  ];

  return (
    <PageTransition>
      <TourGuide 
        steps={tourSteps} 
        run={run} 
        onComplete={handleTourCallback}
        onSkip={handleTourCallback}
      />
      
      <div className="min-h-screen bg-background pb-20">
        {/* Header branco com logo em destaque */}
        <div className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
          <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
            <div className="flex items-center justify-between gap-4 tour-profile">
              {/* Logo e Saudação */}
              <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                <img 
                  src={getAssetPath('ciclik-logo-full.png')}
                  alt="Ciclik - Recicle e Ganhe" 
                  className="h-12 md:h-16 w-auto object-contain flex-shrink-0 cursor-pointer"
                  onClick={() => navigate('/user')}
                />
                <div className="flex flex-col justify-center cursor-pointer" onClick={() => navigate('/profile')}>
                  <h1 className="text-base md:text-xl font-bold text-foreground whitespace-nowrap">
                    Olá, {profile.nome.split(' ')[0]}!
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                    Bem-vindo ao Ciclik
                  </p>
                </div>
              </div>

              {/* Menu Hamburguer */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="rounded-full h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader className="text-left">
                    <SheetTitle className="text-foreground">Menu</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-1">
                    {/* Perfil do Usuário */}
                    <div className="px-3 py-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-semibold text-foreground">
                        {profile.nome}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {profile.email}
                      </p>
                    </div>
                    <Separator className="my-3" />

                    {/* Notificações */}
                    <div className="px-1">
                      <NotificationBell showLabel />
                    </div>

                    {/* Meu Perfil */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="h-5 w-5" />
                      <span>Meu Perfil</span>
                    </Button>

                    {/* Tour Guiado */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={startTour}
                    >
                      <HelpCircle className="h-5 w-5" />
                      <span>Ver Tour Guiado</span>
                    </Button>

                    <Separator className="my-3" />

                    {/* Sair */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={signOut}
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sair</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">

          {/* Hero Card - Pontos Verdes (Estilo Nubank) */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4 }}
          >
            <Card className="tour-score-card overflow-hidden border-0 shadow-lg rounded-3xl bg-gradient-to-br from-card via-card to-primary/5">
              <CardContent className="p-5">
                {/* Pontos principais */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Pontos Verdes
                      </span>
                    </div>
                    <motion.p 
                      className="text-4xl font-bold text-foreground"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                      {pontosCalculados.toLocaleString('pt-BR')}
                    </motion.p>
                  </div>
                  <Badge className={`${getLevelColor(profile.nivel)} text-xs px-3 py-1 rounded-full font-medium`}>
                    {getNivelLabel(profile.nivel)}
                  </Badge>
                </div>

                {/* Botão Extrato */}
                <motion.button
                  onClick={() => navigate('/points-statement')}
                  className="flex items-center gap-1 text-xs text-primary font-medium mb-4"
                  whileTap={{ scale: 0.95 }}
                >
                  Ver extrato completo
                  <ChevronRight className="h-3.5 w-3.5" />
                </motion.button>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progresso mensal
                    </span>
                    <span className="font-medium text-primary">
                      {pontosCalculados} pts
                    </span>
                  </div>
                  <Progress value={scoreProgress} className="h-2 rounded-full" />
                  {pontosCalculados <= 1000 && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      {getNextLevelInfo(pontosCalculados).pontosRestantes} pts para {getNextLevelInfo(pontosCalculados).proximoNivel}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <motion.div 
                  className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50 tour-stats"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {[
                    { value: profile.missoes_concluidas, label: 'Aulas', icon: GraduationCap },
                    { value: profile.cupons_resgatados, label: 'Cupons', icon: Gift },
                    { value: `${formatNumber(pesoTotalEntregue, 2)} kg`, label: 'Reciclados', icon: Recycle },
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="text-center"
                      variants={scaleIn}
                      transition={{ delay: index * 0.1 }}
                    >
                      <stat.icon className="h-4 w-4 mx-auto mb-1 text-primary/70" />
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions - Botões Circulares */}
          <motion.div
            className="tour-quick-actions"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-start px-2">
              <QuickActionButton
                icon={GraduationCap}
                label="Educação"
                onClick={() => navigate('/missions')}
                tourClass="tour-missions"
                bgColor="bg-amber-500/10"
                iconColor="text-amber-500"
                tooltipContent={<p className="text-xs font-medium">🇧🇷 Disponível em todo o Brasil</p>}
              />
              <QuickActionButton
                icon={FileText}
                label="Nota Fiscal"
                onClick={() => navigate('/upload-receipt')}
                bgColor="bg-blue-500/10"
                iconColor="text-blue-500"
                tooltipContent={
                  <NotaFiscalTooltip userId={user?.id} userCity={profile?.cidade} userState={profile?.uf} />
                }
              />
              <QuickActionButton
                icon={Recycle}
                label="Entregar"
                onClick={() => navigate('/select-materials')}
                tourClass="tour-deliver"
                bgColor="bg-primary/10"
                iconColor="text-primary"
                tooltipContent={
                  <EntregarTooltip userId={user?.id} userCity={profile?.cidade} userState={profile?.uf} />
                }
              />
              <QuickActionButton
                icon={Gift}
                label="Cupons"
                onClick={() => navigate('/redeem-coupons')}
                tourClass="tour-coupons"
                bgColor="bg-pink-500/10"
                iconColor="text-pink-500"
                tooltipContent={<p className="text-xs font-medium">🇧🇷 Disponível em todo o Brasil</p>}
              />
              <QuickActionButton
                icon={TrendingUp}
                label="Histórico"
                onClick={() => navigate('/delivery-history')}
                bgColor="bg-purple-500/10"
                iconColor="text-purple-500"
                tooltipContent={<p className="text-xs font-medium">🇧🇷 Disponível em todo o Brasil</p>}
              />
            </div>
          </motion.div>

          {/* Assistente Gamificado */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
          >
            <GamificationAssistant />
          </motion.div>

          {/* Seções Colapsáveis */}
          <motion.div 
            className="space-y-3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            {/* Entregas Pendentes */}
            <Collapsible open={deliveriesOpen} onOpenChange={setDeliveriesOpen}>
              <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Recycle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">Entregas Pendentes</span>
                    </div>
                    <motion.div
                      animate={{ rotate: deliveriesOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    {deliveriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4"
                      >
                        <PendingDeliveries />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Meus Materiais */}
            <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
              <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium text-sm">Meus Materiais</span>
                    </div>
                    <motion.div
                      animate={{ rotate: materialsOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    {materialsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4"
                      >
                        <MaterialsHistory userId={user?.id || ''} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Impacto Ambiental */}
            <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
              <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Leaf className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="font-medium text-sm">Impacto Ambiental</span>
                    </div>
                    <motion.div
                      animate={{ rotate: statsOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    {statsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4"
                      >
                        <RecyclabilityStats />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        </div>

        {/* Bottom Navigation - Animada */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 shadow-2xl z-50"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-around items-center max-w-lg mx-auto py-2 px-4">
            {navItems.map((item) => (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${
                  item.active ? 'text-primary' : 'text-muted-foreground'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={item.active ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon className={`h-5 w-5 ${item.active ? 'text-primary' : ''}`} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
