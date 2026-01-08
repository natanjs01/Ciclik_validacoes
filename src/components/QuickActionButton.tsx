import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  iconColor?: string;
  bgColor?: string;
  className?: string;
  tourClass?: string;
}

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  iconColor = 'text-primary',
  bgColor = 'bg-primary/10',
  className,
  tourClass,
}: QuickActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 group',
        tourClass,
        className
      )}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <motion.div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
          'shadow-sm group-hover:shadow-md',
          bgColor
        )}
        whileHover={{ 
          boxShadow: '0 8px 25px -5px rgba(34, 197, 94, 0.3)'
        }}
      >
        <Icon className={cn('h-6 w-6', iconColor)} />
      </motion.div>
      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </motion.button>
  );
}

export default QuickActionButton;
