import { motion } from 'framer-motion';
import { LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileTooltip } from '@/components/ui/mobile-tooltip';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  iconColor?: string;
  bgColor?: string;
  className?: string;
  tourClass?: string;
  tooltipContent?: React.ReactNode;
}

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  iconColor = 'text-primary',
  bgColor = 'bg-primary/10',
  className,
  tourClass,
  tooltipContent,
}: QuickActionButtonProps) {
  const buttonContent = (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 group relative',
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
      
      {/* Ícone de informação para tooltip */}
      {tooltipContent && (
        <MobileTooltip 
          content={tooltipContent}
          side="bottom"
          className="max-w-[200px] text-center bg-popover border border-border shadow-lg text-xs"
          delayDuration={200}
        >
          <div 
            className="absolute -top-1 -right-1 bg-primary/10 rounded-full p-0.5 cursor-help hover:bg-primary/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-3 w-3 text-primary" />
          </div>
        </MobileTooltip>
      )}
    </motion.button>
  );

  return buttonContent;
}

export default QuickActionButton;
