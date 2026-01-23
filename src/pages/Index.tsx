import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Recycle, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Truque para esconder a barra do navegador em PWA
    window.scrollTo(0, 1);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    
    // Redireciona para a apresentação institucional após um breve delay
    const timer = setTimeout(() => {
      navigate('/apresentacao');
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center overflow-hidden">
      {/* Folhas decorativas - REMOVIDO ANIMAÇÕES INFINITAS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3,
            }}
          >
            <Leaf className="w-8 h-8 text-primary/30" />
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8"
        >
          <img 
            src={`${import.meta.env.BASE_URL}ciclik-logo-full.png`}
            alt="Ciclik" 
            className="h-24 md:h-32 mx-auto"
          />
        </motion.div>

        {/* Título */}
        <motion.h1
          className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Recicle e Ganhe
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          A plataforma que transforma reciclagem em recompensas
        </motion.p>

        {/* Badges animados */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { icon: Recycle, text: "Recicle" },
            { icon: Award, text: "Ganhe Pontos" },
            { icon: Users, text: "Ajude o Mundo" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-primary opacity-70"
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </motion.div>

        {/* Botão manual (caso o redirect não funcione) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8"
        >
          <Button
            size="lg"
            onClick={() => navigate('/apresentacao')}
            className="gap-2"
          >
            Entrar na Plataforma
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
