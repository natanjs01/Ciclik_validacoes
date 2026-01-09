import * as React from "react";
import { useState } from "react";
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
 * - Desktop: Abre com hover, fecha ao remover mouse
 * - Mobile: Abre/fecha com toque, fecha ao tocar fora
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

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger
          asChild={asChild}
          onClick={(e) => {
            e.stopPropagation();
            setTooltipOpen(!tooltipOpen);
          }}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
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
