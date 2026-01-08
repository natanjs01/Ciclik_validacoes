import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

interface CelebrationEffectsProps {
  trigger: boolean;
  onComplete?: () => void;
}

const colors = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
];

export default function CelebrationEffects({ trigger, onComplete }: CelebrationEffectsProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Gerar confetti
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      }));
      setConfetti(pieces);
      setShowBurst(true);

      // Limpar após animação
      const timeout = setTimeout(() => {
        setConfetti([]);
        setShowBurst(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {showBurst && (
        <>
          {/* Burst central */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-6xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.5, 1],
                rotate: [180, 0],
              }}
              transition={{ duration: 0.5, ease: 'backOut' }}
            >
              🎉
            </motion.div>
          </motion.div>

          {/* Confetti pieces */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute top-0"
                style={{
                  left: `${piece.x}%`,
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
                initial={{ 
                  y: -20,
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  x: (Math.random() - 0.5) * 200,
                  rotate: piece.rotation + 720,
                  opacity: [1, 1, 0],
                }}
                transition={{ 
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>

          {/* Sparkle overlay */}
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.8 }}
            style={{
              background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
