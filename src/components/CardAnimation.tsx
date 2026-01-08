import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardAnimationProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
};

export function CardAnimation({ children, delay = 0, className = '' }: CardAnimationProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default CardAnimation;
