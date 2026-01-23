import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Leaf, Clock, Package, Cloud, Droplets, Zap, TreePine } from 'lucide-react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

function AnimatedCounter({ end, duration = 2, suffix = '', decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * end);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count.toFixed(decimals).replace('.', ',')}{suffix}
    </span>
  );
}

const metrics = [
  {
    icon: Leaf,
    value: 500,
    suffix: 'kg',
    label: 'Resíduos Reciclados',
    description: 'Por quota adquirida',
    equivalence: 'Peso de 5 geladeiras',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Clock,
    value: 10,
    suffix: 'min',
    label: 'Educação Ambiental',
    description: 'Por quota adquirida',
    equivalence: '1 aula sobre sustentabilidade',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Package,
    value: 20,
    suffix: '',
    label: 'Produtos Catalogados',
    description: 'Por quota adquirida',
    equivalence: 'Com análise de reciclabilidade',
    color: 'from-amber-500 to-orange-600',
  },
];

const environmentalImpacts = [
  {
    icon: Cloud,
    value: 450,
    suffix: 'kg',
    label: 'CO₂ Evitado',
    color: 'text-blue-400',
  },
  {
    icon: Droplets,
    value: 2500,
    suffix: 'L',
    label: 'Água Economizada',
    color: 'text-cyan-400',
  },
  {
    icon: Zap,
    value: 180,
    suffix: 'kWh',
    label: 'Energia Economizada',
    color: 'text-yellow-400',
  },
  {
    icon: TreePine,
    value: 3,
    suffix: '',
    label: 'Árvores Preservadas',
    color: 'text-green-400',
  },
];

export function ImpactMetrics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-primary text-white overflow-hidden" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-white/70 font-semibold text-sm uppercase tracking-wider">
            Impactos por Quota
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Cada Quota Gera Impacto Real
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Ao investir R$ 2.000 em uma quota CDV, sua marca recebe esses impactos 
            ambientais certificados e rastreáveis.
          </p>
        </motion.div>

        {/* Main Metrics */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center group hover:bg-white/15 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {/* Icon */}
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}
              >
                <metric.icon className="w-10 h-10 text-white" />
              </div>

              {/* Value */}
              <div className="text-6xl md:text-7xl font-bold mb-2">
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>

              {/* Label */}
              <h3 className="text-xl font-semibold mb-2">{metric.label}</h3>
              <p className="text-white/70 text-sm mb-4">{metric.description}</p>

              {/* Equivalence */}
              <div className="inline-block px-4 py-2 bg-white/10 rounded-full text-sm">
                ≈ {metric.equivalence}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Environmental Equivalences */}
        <motion.div
          className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Equivalências Ambientais por Quota
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {environmentalImpacts.map((impact, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              >
                <div>
                  <impact.icon className={`w-12 h-12 mx-auto mb-3 ${impact.color}`} />
                </div>
                <div className="text-3xl font-bold">
                  <AnimatedCounter end={impact.value} suffix={impact.suffix} duration={2.5} />
                </div>
                <div className="text-sm text-white/70">{impact.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
