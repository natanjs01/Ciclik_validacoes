import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Leaf, Users, Package, GraduationCap, Shield, TrendingUp, QrCode, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CDVLanding = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Leaf className="w-8 h-8 text-primary" />,
      title: "1.000 kg de Resíduos",
      description: "Reciclagem certificada de materiais com rastreabilidade completa"
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-secondary" />,
      title: "1.200 Horas de Educação",
      description: "Conteúdo ambiental distribuído para 30 pessoas (40h cada)"
    },
    {
      icon: <Package className="w-8 h-8 text-accent" />,
      title: "18 Embalagens Catalogadas",
      description: "Análise técnica de reciclabilidade e impacto ambiental"
    }
  ];

  const process = [
    {
      step: "Adquira sua quota CDV por R$ 2.000",
      detail: "Investimento único com retorno garantido em impacto ambiental"
    },
    {
      step: "Acompanhe mensalmente o progresso dos impactos",
      detail: "Dashboard exclusivo com métricas em tempo real"
    },
    {
      step: "Aguarde o período de maturação de 12 meses",
      detail: "Enquanto isso, seu investimento gera impacto contínuo"
    },
    {
      step: "Receba certificado digital com QR code de validação",
      detail: "Certificação blockchain auditável e transparente"
    }
  ];

  const features = [
    { icon: Shield, text: "100% Auditável" },
    { icon: QrCode, text: "Blockchain Verificado" },
    { icon: TrendingUp, text: "Impacto Mensurável" },
    { icon: FileCheck, text: "Certificação Digital" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-secondary/10 overflow-hidden">
      {/* Decorative leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Leaf className="w-6 h-6 text-primary/20" />
          </motion.div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-6 text-base px-4 py-2">
            <Leaf className="w-4 h-4 mr-2" />
            Certificado Digital Verde
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Invista no Futuro Sustentável
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            O CDV é um produto de investimento ambiental que garante a entrega de 
            <span className="font-bold text-foreground"> impactos concretos e mensuráveis </span> 
            em 12 meses.
          </p>

          {/* Price & Timeline */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 p-6 bg-card/80 backdrop-blur rounded-2xl border-2 border-primary/20 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-display font-bold text-primary mb-1">R$ 2.000</div>
              <div className="text-sm text-muted-foreground">por quota CDV</div>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="h-px w-12 bg-border sm:hidden" />
            <div className="text-center">
              <div className="text-5xl font-display font-bold text-primary mb-1">12 meses</div>
              <div className="text-sm text-muted-foreground">período de maturação</div>
            </div>
          </div>

          {/* Features badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur rounded-full border shadow-sm"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-lg px-8 shadow-lg">
              Começar Agora <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Benefits */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all h-full shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">{benefit.icon}</div>
                  <h3 className="text-xl font-display font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="max-w-4xl mx-auto mb-16 shadow-2xl border-2">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-10">
                Como Funciona
              </h2>
              <div className="space-y-6">
                {process.map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold mb-1">{item.step}</p>
                      <p className="text-muted-foreground text-sm">{item.detail}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <Users className="w-20 h-20 text-primary mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Pronto para Investir?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Junte-se às empresas que já estão transformando o impacto ambiental 
                em valor mensurável e certificado.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="gap-2 text-lg px-8 shadow-lg"
              >
                Acessar Plataforma <ArrowRight className="w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-6">
                Tem dúvidas? {" "}
                <button 
                  onClick={() => navigate("/investidor")}
                  className="text-primary hover:underline font-semibold"
                >
                  Veja a apresentação completa para investidores
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CDVLanding;
