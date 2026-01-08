import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Leaf, CheckCircle2, Recycle } from 'lucide-react';

interface HeroSectionProps {
  onCtaClick: () => void;
}

// Partículas flutuantes estilo Ciclik - orgânicas e leves
const FloatingLeaf = ({ delay, duration, x, y, size }: { delay: number; duration: number; x: number; y: number; size: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{ 
      left: `${x}%`, 
      top: `${y}%`,
      width: size,
      height: size,
      background: 'linear-gradient(135deg, hsl(76, 72%, 44%, 0.15), hsl(76, 72%, 44%, 0.05))',
    }}
    animate={{
      y: [0, -20, 0],
      x: [0, 10, 0],
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.1, 1],
      rotate: [0, 15, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  // Partículas orgânicas espalhadas
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 24,
  }));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Padrão de fundo orgânico com curvas Ciclik */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Curva superior esquerda */}
        <svg className="absolute -top-20 -left-20 w-96 h-96 text-primary/5" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="currentColor" />
        </svg>
        
        {/* Curva inferior direita */}
        <svg className="absolute -bottom-32 -right-32 w-[500px] h-[500px] text-accent/5" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="currentColor" />
        </svg>

        {/* Folhas flutuantes */}
        {particles.map((p) => (
          <FloatingLeaf key={p.id} {...p} />
        ))}
      </div>

      {/* Gradiente sutil verde Ciclik */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.02]" />

      {/* Conteúdo */}
      <div className="relative z-10 container mx-auto px-4 py-24 pt-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Ícone de reciclagem animado */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Recycle className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-5 py-2.5 text-sm font-display rounded-full">
              <Shield className="w-4 h-4 mr-2" />
              Impactos 100% Auditáveis com QR Code
            </Badge>
          </motion.div>

          {/* Headline - Tipografia Fredoka */}
          <motion.h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Sua Marca Associada a
            <br />
            <span className="text-primary">Impactos Ambientais Reais</span>
          </motion.h1>

          {/* Subheadline - Tipografia Kodchasan */}
          <motion.p
            className="font-body text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Invista em Certificados <strong className="text-primary">Ciclik - Digital Verde</strong> e 
            receba impactos ambientais rastreáveis e auditáveis. Cada quota gera impacto real.
          </motion.p>

          {/* Stats - Cards arredondados */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {[
              { value: '250kg', label: 'Resíduos reciclados', icon: '♻️' },
              { value: '5min', label: 'Educação ambiental', icon: '📚' },
              { value: '1', label: 'Produto catalogado', icon: '📦' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="font-display text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="font-body text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons - Estilo Ciclik */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Button
              size="lg"
              onClick={onCtaClick}
              className="font-display font-semibold bg-primary text-primary-foreground hover:brightness-105 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Leaf className="w-5 h-5 mr-2" />
              Quero Ser Investidor
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-display font-medium border-2 border-primary/30 text-primary hover:bg-primary/5 text-base px-8 py-6 rounded-full transition-all duration-300"
              onClick={() => document.getElementById('projetos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Projetos Disponíveis
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            {[
              'Certificação Digital',
              'Rastreabilidade Total',
              'Compliance ESG',
            ].map((item, i) => (
              <div key={i} className="flex items-center text-muted-foreground text-sm font-body">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator - estilo orgânico */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-7 h-11 rounded-full border-2 border-primary/40 flex items-start justify-center p-2 bg-white/50 backdrop-blur-sm">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}