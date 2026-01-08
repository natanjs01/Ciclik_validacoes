import { motion } from 'framer-motion';

interface DecorativeLeavesProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size?: 'sm' | 'md' | 'lg';
  opacity?: number;
  rotate?: number;
  flip?: boolean;
  className?: string;
}

export function DecorativeLeaves({ 
  position, 
  size = 'md', 
  opacity = 0.15, 
  rotate = 0,
  flip = false,
  className = ''
}: DecorativeLeavesProps) {
  const sizeClasses = {
    sm: 'w-24 h-24 md:w-32 md:h-32',
    md: 'w-32 h-32 md:w-48 md:h-48',
    lg: 'w-48 h-48 md:w-64 md:h-64'
  };

  const positionClasses = {
    'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
    'center-left': 'top-1/2 left-0 -translate-x-1/3 -translate-y-1/2',
    'center-right': 'top-1/2 right-0 translate-x-1/3 -translate-y-1/2'
  };

  return (
    <motion.div
      className={`absolute pointer-events-none z-0 ${positionClasses[position]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <img 
        src="/folhas-ciclik.png" 
        alt=""
        aria-hidden="true"
        className={`${sizeClasses[size]} object-contain`}
        style={{ 
          opacity,
          transform: `rotate(${rotate}deg) ${flip ? 'scaleX(-1)' : ''}`,
          filter: 'blur(0.5px)'
        }}
      />
    </motion.div>
  );
}
