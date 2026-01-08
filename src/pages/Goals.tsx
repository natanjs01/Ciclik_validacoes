import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationProgress } from '@/hooks/useGamificationProgress';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoalsProgressCard from '@/components/GoalsProgressCard';
import CelebrationEffects from '@/components/CelebrationEffects';
import PageTransition from '@/components/PageTransition';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  Award,
  Zap,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const ROTATING_TIPS = [
  { emoji: '📚', text: 'Complete missões educativas para aprender sobre reciclagem e ganhar pontos extras!' },
  { emoji: '📝', text: 'Escaneie suas notas fiscais para catalogar embalagens e contribuir com o meio ambiente.' },
  { emoji: '♻️', text: 'Separe seus recicláveis por tipo para facilitar a triagem nas cooperativas.' },
  { emoji: '👥', text: 'Indique amigos para o Ciclik! Vocês dois ganham pontos quando eles completam a primeira missão.' },
  { emoji: '🎯', text: 'Acompanhe suas metas semanais e mensais para subir de nível mais rápido!' },
  { emoji: '💚', text: 'Cada kg de material reciclado evita emissão de CO² na atmosfera.' },
  { emoji: '🏆', text: 'Quanto mais alto seu nível, mais benefícios e recompensas você desbloqueia!' },
  { emoji: '📦', text: 'Embalagens limpas e secas têm maior valor de reciclagem.' },
  { emoji: '🌍', text: 'Sua contribuição ajuda a construir um futuro mais sustentável para todos.' },
  { emoji: '⭐', text: 'Troque seus pontos por cupons de desconto em lojas parceiras!' },
];

function RotatingTipsCard() {
  const [currentTipIndex, setCurrentTipIndex] = useState(() => {
    // Use the current month to determine starting tip
    const month = new Date().getMonth();
    return month % ROTATING_TIPS.length;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
    }, 8000); // Change tip every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const currentTip = ROTATING_TIPS[currentTipIndex];

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-warning/5 to-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <motion.div
            key={currentTipIndex}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-2xl flex-shrink-0"
          >
            {currentTip.emoji}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-foreground">Dica do Ciclo</p>
              <div className="flex gap-1">
                {ROTATING_TIPS.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${idx === currentTipIndex ? 'bg-primary' : 'bg-muted'}`}
                    animate={idx === currentTipIndex ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-muted-foreground leading-relaxed"
              >
                {currentTip.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Goals() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const progress = useGamificationProgress();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedThisSession, setCelebratedThisSession] = useState(false);

  const getNivelLabel = (level: string) => {
    switch (level) {
      case 'Iniciante': return 'Embaixador Ciclik';
      case 'Ativo': return 'Protetor Ciclik';
      case 'Guardiao Verde': return 'Guardião Ciclik';
      default: return level;
    }
  };

  const getNivelEmoji = (level: string) => {
    switch (level) {
      case 'Iniciante': return '🌱';
      case 'Ativo': return '🌿';
      case 'Guardiao Verde': return '🌳';
      default: return '🌱';
    }
  };

  // Verificar se todas as metas semanais foram atingidas para celebrar
  useEffect(() => {
    if (!celebratedThisSession && !progress.loading) {
      const allWeeklyComplete = 
        progress.missoes.progressoSemanal >= 100 &&
        progress.notas.progressoSemanal >= 100 &&
        progress.entregas.progressoSemanal >= 100 &&
        progress.indicacoes.progressoSemanal >= 100;
      
      if (allWeeklyComplete) {
        setShowCelebration(true);
        setCelebratedThisSession(true);
      }
    }
  }, [progress, celebratedThisSession]);

  const metasSemanaisAtingidas = [
    progress.missoes.progressoSemanal >= 100,
    progress.notas.progressoSemanal >= 100,
    progress.entregas.progressoSemanal >= 100,
    progress.indicacoes.progressoSemanal >= 100,
  ].filter(Boolean).length;

  const metasMensaisAtingidas = [
    progress.missoes.progressoMensal >= 100,
    progress.notas.progressoMensal >= 100,
    progress.entregas.progressoMensal >= 100,
    progress.indicacoes.progressoMensal >= 100,
  ].filter(Boolean).length;

  return (
    <PageTransition>
      <CelebrationEffects 
        trigger={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      <div className="min-h-screen bg-background pb-6">
        {/* Header */}
        <div className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
          <div className="mx-auto max-w-lg px-4 py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => navigate('/user')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Suas Metas
                </h1>
                <p className="text-xs text-muted-foreground">
                  Acompanhe seu progresso semanal e mensal
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">
          {/* Nível e Progresso */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-3xl">{getNivelEmoji(profile?.nivel || 'Iniciante')}</span>
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seu nível</p>
                      <p className="font-bold text-lg text-foreground">
                        {getNivelLabel(profile?.nivel || 'Iniciante')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{progress.pontosMes}</p>
                    <p className="text-xs text-muted-foreground">pts este mês</p>
                  </div>
                </div>

                {/* Barra de progresso para próximo nível */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Próximo: {progress.proximoNivel}
                    </span>
                    <span className="font-medium text-primary">
                      {progress.pontosParaProximoNivel > 0 
                        ? `Faltam ${progress.pontosParaProximoNivel} pts`
                        : '✓ Nível máximo!'
                      }
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progress.progressoNivel} className="h-3 rounded-full" />
                    {progress.progressoNivel >= 90 && progress.pontosParaProximoNivel > 0 && (
                      <motion.div
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Zap className="h-4 w-4 text-warning" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resumo Rápido */}
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-card">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Esta Semana</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metasSemanaisAtingidas}/4</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {progress.diasRestantesSemana} dias restantes
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-success/5 to-card">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="h-4 w-4 text-success" />
                    <span className="text-xs text-muted-foreground">Este Mês</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metasMensaisAtingidas}/4</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {progress.diasRestantesMes} dias restantes
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Tabs de Metas */}
          <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
            <Tabs defaultValue="semanal" className="w-full">
              <TabsList className="w-full rounded-2xl p-1 bg-muted/50">
                <TabsTrigger value="semanal" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Semanal
                </TabsTrigger>
                <TabsTrigger value="mensal" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Mensal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="semanal" className="mt-4 space-y-3">
                <GoalsProgressCard
                  title="Missões Educativas"
                  icon="📚"
                  color="amber"
                  semanal={{ 
                    atual: Math.round(progress.missoes.progressoSemanal * progress.missoes.metaSemanal / 100), 
                    meta: progress.missoes.metaSemanal, 
                    progresso: progress.missoes.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.missoes.atual, 
                    meta: progress.missoes.metaMensal, 
                    progresso: progress.missoes.progressoMensal 
                  }}
                  delay={0}
                />
                <GoalsProgressCard
                  title="Notas Fiscais"
                  icon="📝"
                  color="blue"
                  semanal={{ 
                    atual: Math.round(progress.notas.progressoSemanal * progress.notas.metaSemanal / 100), 
                    meta: progress.notas.metaSemanal, 
                    progresso: progress.notas.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.notas.atual, 
                    meta: progress.notas.metaMensal, 
                    progresso: progress.notas.progressoMensal 
                  }}
                  delay={1}
                />
                <GoalsProgressCard
                  title="Entregas de Recicláveis"
                  icon="♻️"
                  color="green"
                  semanal={{ 
                    atual: Math.round(progress.entregas.progressoSemanal * progress.entregas.metaSemanal / 100), 
                    meta: progress.entregas.metaSemanal, 
                    progresso: progress.entregas.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.entregas.atual, 
                    meta: progress.entregas.metaMensal, 
                    progresso: progress.entregas.progressoMensal 
                  }}
                  delay={2}
                />
                <GoalsProgressCard
                  title="Indicações"
                  icon="👥"
                  color="purple"
                  semanal={{ 
                    atual: Math.round(progress.indicacoes.progressoSemanal * progress.indicacoes.metaSemanal / 100), 
                    meta: progress.indicacoes.metaSemanal, 
                    progresso: progress.indicacoes.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.indicacoes.atual, 
                    meta: progress.indicacoes.metaMensal, 
                    progresso: progress.indicacoes.progressoMensal 
                  }}
                  delay={3}
                />
              </TabsContent>

              <TabsContent value="mensal" className="mt-4 space-y-3">
                <GoalsProgressCard
                  title="Missões Educativas"
                  icon="📚"
                  color="amber"
                  semanal={{ 
                    atual: Math.round(progress.missoes.progressoSemanal * progress.missoes.metaSemanal / 100), 
                    meta: progress.missoes.metaSemanal, 
                    progresso: progress.missoes.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.missoes.atual, 
                    meta: progress.missoes.metaMensal, 
                    progresso: progress.missoes.progressoMensal 
                  }}
                  delay={0}
                />
                <GoalsProgressCard
                  title="Notas Fiscais"
                  icon="📝"
                  color="blue"
                  semanal={{ 
                    atual: Math.round(progress.notas.progressoSemanal * progress.notas.metaSemanal / 100), 
                    meta: progress.notas.metaSemanal, 
                    progresso: progress.notas.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.notas.atual, 
                    meta: progress.notas.metaMensal, 
                    progresso: progress.notas.progressoMensal 
                  }}
                  delay={1}
                />
                <GoalsProgressCard
                  title="Entregas de Recicláveis"
                  icon="♻️"
                  color="green"
                  semanal={{ 
                    atual: Math.round(progress.entregas.progressoSemanal * progress.entregas.metaSemanal / 100), 
                    meta: progress.entregas.metaSemanal, 
                    progresso: progress.entregas.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.entregas.atual, 
                    meta: progress.entregas.metaMensal, 
                    progresso: progress.entregas.progressoMensal 
                  }}
                  delay={2}
                />
                <GoalsProgressCard
                  title="Indicações"
                  icon="👥"
                  color="purple"
                  semanal={{ 
                    atual: Math.round(progress.indicacoes.progressoSemanal * progress.indicacoes.metaSemanal / 100), 
                    meta: progress.indicacoes.metaSemanal, 
                    progresso: progress.indicacoes.progressoSemanal 
                  }}
                  mensal={{ 
                    atual: progress.indicacoes.atual, 
                    meta: progress.indicacoes.metaMensal, 
                    progresso: progress.indicacoes.progressoMensal 
                  }}
                  delay={3}
                />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Dicas do Assistente - Rotativas */}
          <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
            <RotatingTipsCard />
          </motion.div>

          {/* CTA para ação sugerida */}
          {progress.metaEmRisco && (
            <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
              <Button 
                className="w-full rounded-2xl h-12 bg-gradient-to-r from-primary to-success hover:opacity-90"
                onClick={() => {
                  if (progress.metaEmRisco === 'missões') navigate('/missions');
                  else if (progress.metaEmRisco === 'notas fiscais') navigate('/upload-receipt');
                  else if (progress.metaEmRisco === 'entregas') navigate('/select-materials');
                  else navigate('/profile');
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Completar meta de {progress.metaEmRisco}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
