import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Home, ArrowLeft, Leaf, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4 overflow-hidden">
      {/* Folhas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Leaf className="w-12 h-12 text-primary/20" />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full relative z-10"
      >
        <Card className="p-8 md:p-12 border-2 shadow-2xl bg-card/95 backdrop-blur">
          {/* Ícone de erro animado */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            </div>
          </motion.div>

          {/* Código 404 */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-8xl md:text-9xl font-display font-bold text-primary mb-2">
              404
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Search className="w-4 h-4" />
              <p className="text-sm font-mono">{location.pathname}</p>
            </div>
          </motion.div>

          {/* Mensagem */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground text-lg mb-2">
              Ops! Parece que você se perdeu na reciclagem...
            </p>
            <p className="text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
          </motion.div>

          {/* Sugestões */}
          <motion.div
            className="bg-muted/50 rounded-lg p-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-semibold mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Sugestões:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Verifique se digitou o endereço corretamente
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Tente voltar à página anterior
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Ou retorne à página inicial
              </li>
            </ul>
          </motion.div>

          {/* Botões de ação */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="w-5 h-5" />
              Ir para Início
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
          </motion.div>

          {/* Logo Ciclik no rodapé */}
          <motion.div
            className="mt-8 pt-6 border-t text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <img
              src="/ciclik-logo.png"
              alt="Ciclik"
              className="h-8 mx-auto opacity-50 hover:opacity-100 transition-opacity"
            />
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
