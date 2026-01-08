import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Leaf, Receipt, Building2, Loader2 } from 'lucide-react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({ end, duration = 2.5, suffix = '' }: AnimatedCounterProps) {
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
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
}

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ecosystem-stats'],
    queryFn: async () => {
      const [usersRes, deliveriesRes, notasRes, cooperativasRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('entregas_reciclaveis').select('peso_validado').eq('status', 'finalizada'),
        supabase.from('notas_fiscais').select('id', { count: 'exact', head: true }),
        supabase.from('cooperativas').select('id', { count: 'exact', head: true }).eq('status', 'ativa'),
      ]);

      const totalKg = deliveriesRes.data?.reduce((sum, d) => sum + (d.peso_validado || 0), 0) || 0;

      return {
        usuarios: usersRes.count || 0,
        kgReciclados: totalKg,
        notasFiscais: notasRes.count || 0,
        cooperativas: cooperativasRes.count || 0,
      };
    },
  });

  const metrics = [
    {
      icon: Users,
      value: stats?.usuarios || 1500,
      suffix: '+',
      label: 'Usuários Ativos',
      description: 'Pessoas gerando impactos',
    },
    {
      icon: Leaf,
      value: stats?.kgReciclados || 25000,
      suffix: 'kg',
      label: 'Resíduos Reciclados',
      description: 'Já destinados corretamente',
    },
    {
      icon: Receipt,
      value: stats?.notasFiscais || 8000,
      suffix: '+',
      label: 'Notas Fiscais',
      description: 'Produtos catalogados',
    },
    {
      icon: Building2,
      value: stats?.cooperativas || 15,
      suffix: '+',
      label: 'Operadores Logísticos',
      description: 'Parceiros certificados',
    },
  ];

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Prova Social
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Um Ecossistema em Crescimento
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Milhares de pessoas e empresas já fazem parte da Ciclik, 
            gerando impactos ambientais reais todos os dias.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <metric.icon className="w-10 h-10 text-primary" />
              </motion.div>
              
              <div className="text-5xl font-bold text-foreground mb-2">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {metric.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {metric.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Logos */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-center text-muted-foreground mb-8">
            Empresas que já investem em impactos ambientais com a Ciclik
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {/* Placeholder logos - replace with real logos when available */}
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-32 h-12 bg-muted rounded-lg flex items-center justify-center"
                whileHover={{ opacity: 1, scale: 1.05 }}
              >
                <span className="text-muted-foreground text-xs">Empresa {i}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          className="mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 text-center relative">
            <div className="text-6xl text-primary/20 absolute top-4 left-8">"</div>
            <blockquote className="text-xl md:text-2xl text-foreground italic mb-6 relative z-10">
              Investir em CDVs da Ciclik nos permitiu associar nossa marca a impactos 
              ambientais reais e rastreáveis. A transparência do sistema e a qualidade 
              dos certificados superaram nossas expectativas.
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Maria Silva</div>
                <div className="text-sm text-muted-foreground">Diretora de Sustentabilidade</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
