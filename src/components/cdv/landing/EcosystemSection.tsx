import { motion } from 'framer-motion';
import { BookOpen, Receipt, Recycle, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const pillars = [
  {
    icon: BookOpen,
    title: 'Educação Ambiental',
    description: 'Usuários estudam conteúdo sobre sustentabilidade, reciclagem e consumo consciente. Cada minuto assistido gera impacto.',
    color: 'bg-primary',
    emoji: '📚',
  },
  {
    icon: Receipt,
    title: 'Pesquisa de Consumo',
    description: 'Captura de notas fiscais gera dados sobre embalagens e hábitos de consumo. Cada produto catalogado é rastreável.',
    color: 'bg-accent',
    emoji: '🧾',
  },
  {
    icon: Recycle,
    title: 'Destinação Adequada',
    description: 'Agendamento de coleta de recicláveis com cooperativas certificadas. Cada kg entregue é validado e registrado.',
    color: 'bg-primary',
    emoji: '♻️',
  },
  {
    icon: Coins,
    title: 'Cashback Verde',
    description: 'Usuários ganham pontos e recompensas reais por suas ações ambientais. Engajamento que gera impacto.',
    color: 'bg-accent',
    emoji: '🏆',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
};

export function EcosystemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden" ref={ref}>
      {/* Elementos decorativos - formas orgânicas Ciclik */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-display text-primary font-semibold text-sm uppercase tracking-wider inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Ecossistema Ciclik
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Como Geramos Impactos Reais
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Um programa de fidelidade ambiental onde você recicla e todos ganham — 
            impactos mensuráveis atribuídos às marcas investidoras.
          </p>
        </motion.div>

        {/* Pillars Grid - Cards arredondados estilo Ciclik */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative bg-white rounded-2xl p-6 border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Emoji decorativo */}
              <div className="text-3xl mb-4">{pillar.emoji}</div>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${pillar.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                <pillar.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {pillar.title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                {pillar.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity font-display text-sm font-medium">
                Saiba mais
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Flow Diagram - Estilo Ciclik com arredondamentos */}
        <motion.div
          className="mt-20 relative"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 rounded-3xl p-8 md:p-10 border border-primary/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Step 1 */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 border-2 border-primary/30">
                  <span className="font-display text-xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">Usuários Agem</h4>
                <p className="font-body text-xs text-muted-foreground mt-1">Estudam, registram e reciclam</p>
              </div>

              {/* Arrow */}
              <motion.div 
                className="hidden md:block text-primary/40"
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>

              {/* Step 2 */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 border-2 border-primary/30">
                  <span className="font-display text-xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">Impactos Gerados</h4>
                <p className="font-body text-xs text-muted-foreground mt-1">Cada ação vira UIB rastreável</p>
              </div>

              {/* Arrow */}
              <motion.div 
                className="hidden md:block text-primary/40"
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>

              {/* Step 3 */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 border-2 border-primary/30">
                  <span className="font-display text-xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">CDVs Emitidos</h4>
                <p className="font-body text-xs text-muted-foreground mt-1">Certificados digitais validáveis</p>
              </div>

              {/* Arrow */}
              <motion.div 
                className="hidden md:block text-primary/40"
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>

              {/* Step 4 - Final */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-xl text-white">✓</span>
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">Marca Associada</h4>
                <p className="font-body text-xs text-muted-foreground mt-1">Impactos atribuídos ao investidor</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}