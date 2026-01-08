import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, Sparkles } from 'lucide-react';

interface GoalData {
  atual: number;
  meta: number;
  progresso: number;
}

interface GoalsProgressCardProps {
  title: string;
  icon: string;
  color: string;
  semanal: GoalData;
  mensal: GoalData;
  delay?: number;
  actionPath?: string;
  actionLabel?: string;
}

const actionPaths: Record<string, { path: string; label: string }> = {
  'Missões Educativas': { path: '/missions', label: 'Iniciar Missão' },
  'Notas Fiscais': { path: '/upload-receipt', label: 'Enviar Nota' },
  'Entregas de Recicláveis': { path: '/select-materials', label: 'Agendar Entrega' },
  'Indicações': { path: '/profile', label: 'Convidar Amigos' },
};

function AnimatedEmoji({ icon }: { icon: string }) {
  if (icon === '📚') {
    return (
      <motion.div
        className="text-3xl"
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        {icon}
      </motion.div>
    );
  }
  if (icon === '📝') {
    return (
      <motion.div
        className="text-3xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        {icon}
      </motion.div>
    );
  }
  if (icon === '♻️') {
    return (
      <motion.div
        className="text-3xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        {icon}
      </motion.div>
    );
  }
  if (icon === '👥') {
    return (
      <motion.div
        className="text-3xl"
        animate={{ x: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        {icon}
      </motion.div>
    );
  }
  return (
    <motion.div
      className="text-3xl"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
    >
      {icon}
    </motion.div>
  );
}

export default function GoalsProgressCard({ 
  title, 
  icon, 
  color, 
  semanal, 
  mensal,
  delay = 0,
  actionPath,
  actionLabel
}: GoalsProgressCardProps) {
  const navigate = useNavigate();
  const isSemanComplete = semanal.progresso >= 100;
  const isMensComplete = mensal.progresso >= 100;
  const isAllComplete = isSemanComplete && isMensComplete;

  const action = actionPaths[title] || { path: actionPath || '/user', label: actionLabel || 'Ir' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative p-4 rounded-2xl border overflow-hidden",
        isAllComplete 
          ? "bg-gradient-to-br from-success/10 via-success/5 to-card border-success/30" 
          : "bg-card border-border hover:border-primary/30 hover:shadow-md"
      )}
    >
      {/* Background decoration */}
      <motion.div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10"
        style={{ background: isAllComplete ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Header with animated icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AnimatedEmoji icon={icon} />
          <div>
            <span className="font-semibold text-foreground">{title}</span>
            {isAllComplete && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 mt-0.5"
              >
                <Sparkles className="h-3 w-3 text-success" />
                <span className="text-[10px] text-success font-medium">Metas concluídas!</span>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="sm"
            variant={isAllComplete ? "outline" : "default"}
            className={cn(
              "rounded-full h-8 px-3 text-xs shadow-sm",
              isAllComplete 
                ? "border-success text-success hover:bg-success/10" 
                : "bg-primary hover:bg-primary/90"
            )}
            onClick={() => navigate(action.path)}
          >
            {action.label}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </motion.div>
      </div>

      <div className="space-y-4">
        {/* Meta Semanal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Meta Semanal</span>
            <div className="flex items-center gap-2">
              <motion.span 
                className="font-bold text-foreground"
                key={semanal.atual}
                initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              >
                {semanal.atual}/{semanal.meta}
              </motion.span>
              {isSemanComplete && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  className="text-success text-sm"
                >
                  ✓
                </motion.span>
              )}
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={semanal.progresso} 
              className={cn("h-2.5 rounded-full", isSemanComplete && "[&>div]:bg-success")}
            />
            {semanal.progresso >= 70 && semanal.progresso < 100 && (
              <motion.div
                className="absolute right-1 top-1/2 -translate-y-1/2 text-sm"
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                🔥
              </motion.div>
            )}
            {isSemanComplete && (
              <motion.div
                className="absolute right-1 top-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ type: 'spring' }}
              >
                🎉
              </motion.div>
            )}
          </div>
        </div>

        {/* Meta Mensal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Meta Mensal</span>
            <div className="flex items-center gap-2">
              <motion.span 
                className="font-bold text-foreground"
                key={mensal.atual}
                initial={{ scale: 1.5, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
              >
                {mensal.atual}/{mensal.meta}
              </motion.span>
              {isMensComplete && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                  className="text-success text-sm"
                >
                  ✓
                </motion.span>
              )}
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={mensal.progresso} 
              className={cn("h-2.5 rounded-full", isMensComplete && "[&>div]:bg-success")}
            />
            {mensal.progresso >= 70 && mensal.progresso < 100 && (
              <motion.div
                className="absolute right-1 top-1/2 -translate-y-1/2 text-sm"
                animate={{ 
                  y: [0, -3, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ⚡
              </motion.div>
            )}
            {isMensComplete && (
              <motion.div
                className="absolute right-1 top-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ type: 'spring' }}
              >
                🏆
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Celebration overlay for completed goals */}
      {isAllComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-success/30"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
