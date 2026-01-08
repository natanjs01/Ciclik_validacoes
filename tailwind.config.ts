import type { Config } from "tailwindcss";

/**
 * ═══════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM CICLIK — TAILWIND CONFIG
 * Fonte única de verdade baseada no Brandbook oficial
 * ═══════════════════════════════════════════════════════════════════
 * 
 * CORES OFICIAIS:
 * - Verde Ciclik: #95C11F
 * - Laranja Ciclik: #FBBB1A
 * 
 * TIPOGRAFIA:
 * - Fredoka: títulos, botões, CTAs
 * - Kodchasan: textos longos
 * 
 * ESTILO:
 * - Linhas arredondadas
 * - Design simples: "Menos é mais"
 * - Fundos claros preferenciais
 * ═══════════════════════════════════════════════════════════════════
 */

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ═══════════════════════════════════════════════════════════════
         TIPOGRAFIA CICLIK — Brandbook Oficial
         ═══════════════════════════════════════════════════════════════ */
      fontFamily: {
        display: ["Fredoka", "system-ui", "sans-serif"],
        body: ["Kodchasan", "system-ui", "sans-serif"],
        fredoka: ["Fredoka", "system-ui", "sans-serif"],
        kodchasan: ["Kodchasan", "system-ui", "sans-serif"],
      },
      
      /* ═══════════════════════════════════════════════════════════════
         CORES — Derivadas do Design System (index.css)
         ═══════════════════════════════════════════════════════════════ */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      
      /* ═══════════════════════════════════════════════════════════════
         BORDER RADIUS — Arredondado (Brandbook: linhas curvas)
         ═══════════════════════════════════════════════════════════════ */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      
      /* ═══════════════════════════════════════════════════════════════
         SOMBRAS — Suaves e elegantes
         ═══════════════════════════════════════════════════════════════ */
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow-primary)",
        "glow-accent": "var(--shadow-glow-accent)",
      },
      
      /* ═══════════════════════════════════════════════════════════════
         ANIMAÇÕES — Suaves, leves, feedback visual
         ═══════════════════════════════════════════════════════════════ */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(76 72% 44% / 0.4)" },
          "50%": { boxShadow: "0 0 20px 10px hsl(76 72% 44% / 0.2)" },
        },
        "pulse-glow-accent": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(43 97% 54% / 0.4)" },
          "50%": { boxShadow: "0 0 20px 10px hsl(43 97% 54% / 0.2)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        celebrate: {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.1) rotate(-3deg)" },
          "50%": { transform: "scale(1.15) rotate(3deg)" },
          "75%": { transform: "scale(1.1) rotate(-3deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-glow-accent": "pulse-glow-accent 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
        celebrate: "celebrate 0.6s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
