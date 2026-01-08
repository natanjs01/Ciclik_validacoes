import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Building2, Users, Zap, Award, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Building2,
    title: 'Empresa Investe',
    description: 'Sua marca adquire quotas de um projeto CDV. Cada quota custa R$ 2.000 e garante uma parcela de impactos ambientais.',
    highlight: 'R$ 2.000 / quota',
    emoji: '🏢',
  },
  {
    number: '02',
    icon: Users,
    title: 'Usuários Geram Impactos',
    description: 'Pessoas físicas, condomínios e empresas usam a Ciclik para estudar, registrar notas fiscais e destinar recicláveis.',
    highlight: 'Milhares de usuários',
    emoji: '👥',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Conversão em UIBs',
    description: 'Cada ação gera Unidades de Impacto Bruto (UIBs) rastreáveis. 1kg = 1 UIB, 1 minuto = 1 UIB, 1 produto = 1 UIB.',
    highlight: '256 UIBs por CDV',
    emoji: '⚡',
  },
  {
    number: '04',
    icon: Award,
    title: 'CDV Certificado',
    description: 'Quando a quota atinge 100%, um Certificado Digital Verde é emitido com QR code para validação pública.',
    highlight: 'Certificado Auditável',
    emoji: '🏆',
  },
];

export function HowCDVWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/20 to-white" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-display text-primary font-semibold text-sm uppercase tracking-wider inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Como Funciona
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Do Investimento ao Certificado
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Um processo transparente e rastreável que transforma seu investimento 
            em impactos ambientais reais e verificáveis.
          </p>
        </motion.div>

        {/* Timeline - Estilo Ciclik */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-20 w-0.5 h-12 bg-gradient-to-b from-primary/40 to-primary/10" />
              )}

              <div className="flex gap-5 mb-6">
                {/* Icon Circle - Arredondado estilo Ciclik */}
                <motion.div
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white border-2 border-primary rounded-full flex items-center justify-center text-xs font-display font-bold text-primary shadow-sm">
                    {step.number}
                  </span>
                </motion.div>

                {/* Content Card */}
                <div className="flex-1 bg-white rounded-2xl p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{step.emoji}</span>
                        <h3 className="font-display text-lg font-bold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="font-body text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-display font-semibold">
                        {step.highlight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual Formula - Cards arredondados */}
        <motion.div
          className="mt-16 bg-gradient-to-r from-primary/8 via-primary/5 to-accent/5 rounded-3xl p-8 md:p-10 border border-primary/10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h3 className="font-display text-xl md:text-2xl font-bold text-center text-foreground mb-8">
            Fórmula do Ciclik - Digital Verde
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            <div className="text-center bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary">250</div>
              <div className="font-body text-xs text-muted-foreground mt-1">UIBs Resíduos</div>
              <div className="font-body text-[10px] text-muted-foreground/70">(250 kg)</div>
            </div>
            
            <span className="font-display text-2xl text-primary/50">+</span>
            
            <div className="text-center bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary">5</div>
              <div className="font-body text-xs text-muted-foreground mt-1">UIBs Educação</div>
              <div className="font-body text-[10px] text-muted-foreground/70">(5 minutos)</div>
            </div>
            
            <span className="font-display text-2xl text-primary/50">+</span>
            
            <div className="text-center bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary">1</div>
              <div className="font-body text-xs text-muted-foreground mt-1">UIBs Produtos</div>
              <div className="font-body text-[10px] text-muted-foreground/70">(1 produto)</div>
            </div>
            
            <span className="font-display text-2xl text-primary/50">=</span>
            
            <div className="text-center bg-primary rounded-2xl p-5 shadow-lg">
              <div className="text-3xl md:text-4xl font-display font-bold text-white">1 CDV</div>
              <div className="font-body text-xs text-white/80 mt-1">Certificado Completo</div>
              <div className="font-body text-[10px] text-white/60">(256 UIBs totais)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}