import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DESIGN SYSTEM CICLIK — BOTÕES
 * 
 * Tipografia: Fredoka (font-display)
 * Border Radius: Arredondado (rounded-xl)
 * Cores: Verde Ciclik (primary), Laranja Ciclik (accent)
 * 
 * Microcopy: Verbos de ação — Ganhar, Reciclar, Conquistar, Avançar, Ativar
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Verde Ciclik — CTA principal
        default: "bg-primary text-primary-foreground hover:brightness-105 shadow-sm hover:shadow-[0_0_24px_hsl(76_72%_44%_/_0.35)]",
        
        // Laranja Ciclik — Destaque/Ganho
        accent: "bg-accent text-accent-foreground hover:brightness-105 shadow-sm hover:shadow-[0_0_24px_hsl(43_97%_54%_/_0.35)]",
        
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        
        // Outline Verde — Borda primary
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
        
        // Outline Laranja — Borda accent
        "outline-accent": "border-2 border-accent bg-transparent text-accent hover:bg-accent/10",
        
        // Secondary — Fundo suave
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // Ghost — Sem fundo
        ghost: "hover:bg-muted text-foreground",
        
        // Link
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-xl text-sm",
        sm: "h-9 px-4 py-1.5 rounded-lg text-sm",
        lg: "h-12 px-8 py-3 rounded-xl text-base",
        xl: "h-14 px-10 py-4 rounded-2xl text-lg",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
