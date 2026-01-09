import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGamificationProgress } from '@/hooks/useGamificationProgress';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Target, 
  ChevronRight, 
  TrendingUp,
  Zap,
  X
} from 'lucide-react';

interface GamificationAssistantProps {
  compact?: boolean;
  onClose?: () => void;
}

const mascotExpressions = {
  feliz: '😊',
  animado: '🤩',
  preocupado: '😯',
  celebrando: '🎉',
};

// Dicas do Ciclo com CTAs
const CYCLE_TIPS = [
  { 
    emoji: '📚', 
    text: 'Que tal aprender algo novo com uma aula educacional?',
    cta: 'Ver Aulas',
    route: '/missions',
    color: 'amber'
  },
  { 
    emoji: '📝', 
    text: 'Escaneie suas notas fiscais e ajude a catalogar embalagens recicláveis!',
    cta: 'Escanear Nota',
    route: '/upload-receipt',
    color: 'blue'
  },
  { 
    emoji: '♻️', 
    text: 'Separe seus recicláveis e entregue em uma cooperativa parceira!',
    cta: 'Entregar Agora',
    route: '/select-materials',
    color: 'green'
  },
  { 
    emoji: '👥', 
    text: 'Indique amigos para o Ciclik! Vocês dois ganham pontos!',
    cta: 'Convidar Amigos',
    route: '/profile',
    color: 'purple'
  },
  { 
    emoji: '🎯', 
    text: 'Acompanhe suas metas semanais e suba de nível mais rápido!',
    cta: 'Ver Metas',
    route: '/goals',
    color: 'primary'
  },
  { 
    emoji: '🎁', 
    text: 'Troque seus pontos por cupons de desconto em lojas parceiras!',
    cta: 'Ver Cupons',
    route: '/redeem-coupons',
    color: 'pink'
  },
  { 
    emoji: '💚', 
    text: 'Cada kg de material reciclado evita emissão de CO² na atmosfera.',
    cta: 'Meu Impacto',
    route: '/delivery-history',
    color: 'green'
  },
  { 
    emoji: '🏆', 
    text: 'Quanto mais alto seu nível, mais benefícios você desbloqueia!',
    cta: 'Ver Progresso',
    route: '/goals',
    color: 'amber'
  },
];

const getButtonColors = (color: string) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    pink: 'bg-pink-500 hover:bg-pink-600 text-white',
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  };
  return colors[color] || colors.primary;
};

export default function GamificationAssistant({ compact = false, onClose }: GamificationAssistantProps) {
  const navigate = useNavigate();
  const progress = useGamificationProgress();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [currentTipIndex, setCurrentTipIndex] = useState(() => {
    const month = new Date().getMonth();
    return month % CYCLE_TIPS.length;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % CYCLE_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = CYCLE_TIPS[currentTipIndex];

  if (progress.loading) {
    return (
      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-primary/5 via-card to-success/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metasSemanaisAtingidas = [
    progress.missoes.progressoSemanal >= 100,
    progress.notas.progressoSemanal >= 100,
    progress.entregas.progressoSemanal >= 100,
    progress.indicacoes.progressoSemanal >= 100,
  ].filter(Boolean).length;

  if (compact && !isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <motion.button
          onClick={() => setIsExpanded(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-success shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: progress.expressaoAssistente === 'animado' 
              ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 20px rgba(34, 197, 94, 0)']
              : undefined
          }}
          transition={{ 
            boxShadow: { duration: 1.5, repeat: Infinity }
          }}
        >
          <span className="text-2xl">{mascotExpressions[progress.expressaoAssistente]}</span>
          {metasSemanaisAtingidas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-success text-white text-xs rounded-full flex items-center justify-center font-bold">
              {metasSemanaisAtingidas}
            </span>
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className={compact ? 'fixed bottom-24 right-4 left-4 z-50 max-w-sm ml-auto' : ''}
    >
      <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-primary/5 via-card to-success/5 overflow-hidden">
        <CardContent className="p-0">
          {/* Dica do Ciclo com CTA */}
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              {/* Emoji animado */}
              <motion.div
                key={currentTipIndex}
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-md">
                  <span className="text-2xl">{currentTip.emoji}</span>
                </div>
              </motion.div>

              {/* Mensagem e CTA */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary">Dica do Ciclo</span>
                  <div className="flex gap-1">
                    {CYCLE_TIPS.map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full cursor-pointer ${idx === currentTipIndex ? 'bg-primary' : 'bg-muted'}`}
                        animate={idx === currentTipIndex ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.5 }}
                        onClick={() => setCurrentTipIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-foreground leading-tight mb-2"
                  >
                    {currentTip.text}
                  </motion.p>
                </AnimatePresence>
                
                {/* CTA Button */}
                <motion.div
                  key={`cta-${currentTipIndex}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button 
                    size="sm"
                    className={`h-8 px-4 rounded-full text-xs font-medium shadow-sm ${getButtonColors(currentTip.color)}`}
                    onClick={() => navigate(currentTip.route)}
                  >
                    {currentTip.cta}
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </motion.div>
              </div>

              {compact && onClose && (
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progresso do nível */}
          <div className="px-4 pb-3">
            {/* LINHA DO PRÓXIMO NÍVEL COMENTADA - Informação de progressão removida
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Próximo: {progress.proximoNivel}
              </span>
              <span className="font-medium text-primary">
                {progress.pontosParaProximoNivel > 0 ? `-${progress.pontosParaProximoNivel} pts` : '✓'}
              </span>
            </div>
            */}
            <div className="relative">
              <Progress value={progress.progressoNivel} className="h-2" />
              {progress.progressoNivel >= 80 && (
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Zap className="h-4 w-4 text-warning" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4 pb-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Missões', value: progress.missoes.progressoSemanal, icon: '📚', route: '/missions' },
                { label: 'Notas', value: progress.notas.progressoSemanal, icon: '📝', route: '/upload-receipt' },
                { label: 'Entregas', value: progress.entregas.progressoSemanal, icon: '♻️', route: '/select-materials' },
                { label: 'Convites', value: progress.indicacoes.progressoSemanal, icon: '👥', route: '/profile' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="relative cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(stat.route)}
                >
                  <div className={`text-center p-2 rounded-xl transition-colors ${stat.value >= 100 ? 'bg-success/10' : 'bg-muted/50 hover:bg-muted'}`}>
                    <span className="text-lg">{stat.icon}</span>
                    <div className="mt-1">
                      <Progress 
                        value={stat.value} 
                        className="h-1"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{Math.round(stat.value)}%</span>
                  </div>
                  {stat.value >= 100 && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Badge className="h-4 w-4 p-0 bg-success flex items-center justify-center">
                        <span className="text-[8px]">✓</span>
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer com CTA para Metas - Premium Design */}
          <div className="px-4 pb-4">
            <motion.button
              onClick={() => navigate('/goals')}
              className="relative w-full h-14 rounded-2xl overflow-hidden group shadow-lg"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Background gradient animado */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-primary via-success via-50% to-primary bg-[length:200%_100%]"
                animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-white/20 blur-xl" />
              </div>
              
              {/* Brilho superior */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              {/* Conteúdo */}
              <div className="relative flex items-center justify-between px-5 h-full">
                <div className="flex items-center gap-4">
                  {/* Ícone animado com pulse */}
                  <motion.div
                    className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
                    animate={{ 
                      boxShadow: ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 8px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0.4)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    >
                      <Target className="h-4.5 w-4.5 text-white" />
                    </motion.div>
                    {/* Sparkle */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="h-3 w-3 text-yellow-300" />
                    </motion.div>
                  </motion.div>
                  
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-white tracking-wide">Ver todas as metas</span>
                    <span className="text-[10px] text-white/70 font-medium">Acompanhe seu progresso</span>
                  </div>
                </div>
                
                {/* Seta animada com círculo */}
                <motion.div
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </motion.div>
              </div>
              
              {/* Brilho inferior */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.button>
          </div>

          {/* Dias restantes */}
          <div className="bg-muted/30 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>⏱️ {progress.diasRestantesSemana} dias restantes na semana</span>
            <span>📅 {progress.diasRestantesMes} dias no mês</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
