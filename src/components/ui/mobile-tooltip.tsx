import * as React from "react";
import { useState, useRef, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface MobileTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
  asChild?: boolean;
}

/**
 * Tooltip com suporte completo para mobile e desktop
 * 
 * - Desktop: Abre com hover, fecha ao clicar fora ou abrir outro tooltip
 * - Mobile: Abre com toque longo (pressionar e segurar), fecha ao tocar fora
 * - Permite clicar em links dentro do tooltip
 * 
 * @example
 * <MobileTooltip content="Informação útil">
 *   <Button>Clique aqui</Button>
 * </MobileTooltip>
 */
export function MobileTooltip({
  children,
  content,
  side = "bottom",
  delayDuration = 300,
  className,
  asChild = true,
}: MobileTooltipProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isTouching = useRef(false);

  // Limpa o timer
  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Inicia toque longo (500ms)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isTouching.current = true;
    clearTimer();
    
    longPressTimer.current = setTimeout(() => {
      if (isTouching.current) {
        setTooltipOpen(true);
      }
    }, 500); // 500ms = meio segundo de pressão
  }, [clearTimer]);

  // Cancela toque longo se soltar antes do tempo
  const handleTouchEnd = useCallback(() => {
    isTouching.current = false;
    clearTimer();
  }, [clearTimer]);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          asChild={asChild}
          onMouseEnter={() => setTooltipOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={className}
          onPointerDownOutside={() => setTooltipOpen(false)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
