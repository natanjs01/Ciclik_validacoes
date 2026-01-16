import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN SYSTEM CICLIK — BADGES
 * 
 * Border Radius: Arredondado (rounded-full)
 * Tipografia: Fredoka (font-display)
 * Cores: Verde Ciclik, Laranja Ciclik
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-display font-medium transition-colors",
  {
    variants: {
      variant: {
        // Verde Ciclik — Padrão
        default: "bg-primary/15 text-primary",
        
        // Laranja Ciclik — Destaque/Ganho
        accent: "bg-accent/20 text-accent-foreground",
        
        // Sucesso — Verde Ciclik sólido
        success: "bg-success text-success-foreground",
        
        // Warning — Laranja Ciclik sólido
        warning: "bg-warning text-warning-foreground",
        
        // Secondary — Suave
        secondary: "bg-secondary text-secondary-foreground",
        
        // Muted — Neutro
        muted: "bg-muted text-muted-foreground",
        
        // Destructive
        destructive: "bg-destructive/15 text-destructive",
        
        // Outline Verde
        outline: "border border-primary text-primary bg-transparent",
        
        // Outline Laranja
        "outline-accent": "border border-accent text-accent bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
