import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Leaf, Recycle, GraduationCap, ShoppingCart, Award, Users, 
  Building2, TreePine, BarChart3, Target, CheckCircle2,
  ArrowRight, ArrowLeft, ChevronDown, Globe, Shield, TrendingUp, 
  FileCheck, QrCode, LineChart, Coins, Calendar, Lock, Clock,
  BadgeCheck, PieChart, Zap, Eye, Heart, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

// Importar imagens ODS
import ods08 from "@/assets/ods/ods-08.jpg";
import ods09 from "@/assets/ods/ods-09.jpg";
import ods10 from "@/assets/ods/ods-10.jpg";
import ods11 from "@/assets/ods/ods-11.jpg";
import ods12 from "@/assets/ods/ods-12.jpg";
import ods13 from "@/assets/ods/ods-13.jpg";

// Mapa de imagens ODS
const odsImages: Record<number, string> = {
  8: ods08,
  9: ods09,
  10: ods10,
  11: ods11,
  12: ods12,
  13: ods13,
};

// Componente de slide animado
const AnimatedSlide = ({ 
  children, 
  className = "",
  id
}: { 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`min-h-screen flex items-center justify-center py-16 px-4 md:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
};

// Contador animado
const AnimatedCounter = ({ end, suffix = "", duration = 2 }: { end: number; suffix?: string; duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, hasAnimated, end, duration]);

  return <span ref={ref}>{count.toLocaleString('pt-BR')}{suffix}</span>;
};

const InvestorPresentation = () => {
  const navigate = useNavigate();

  const scrollToNext = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* Botão Voltar Fixo */}
      <motion.div
        className="fixed top-4 left-4 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/apresentacao')}
          className="font-display font-medium bg-white/90 backdrop-blur-sm hover:bg-white shadow-md rounded-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </motion.div>

      {/* ===== SLIDE 1: HERO PARA INVESTIDORES ===== */}
      <AnimatedSlide id="hero" className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
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
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Leaf className="w-6 h-6 text-primary/30" />
            </motion.div>
          ))}
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-display text-primary font-medium">Para Empresas Investidoras</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <img 
              src="/ciclik-logo-full.png" 
              alt="Ciclik" 
              className="h-16 md:h-20 mx-auto"
            />
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Certificado Digital
            <br /><span className="text-primary">Verde (CDV)</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground font-body max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Invista em impacto ambiental <strong>real, mensurável e auditável</strong>. 
            Associe sua marca a ações concretas de reciclagem e educação ambiental.
          </motion.p>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { value: "256", label: "UIBs por CDV" },
              { value: "100%", label: "Rastreável" },
              { value: "QR Code", label: "Validação Pública" },
            ].map((item, i) => (
              <div key={i} className="bg-card/80 backdrop-blur p-4 rounded-xl border">
                <div className="text-3xl font-display font-bold text-primary mb-2">{item.value}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => scrollToNext('o-que-e-cdv')}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Ver Detalhes do Investimento
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              <FileCheck className="w-5 h-5 mr-2" />
              Solicitar Proposta
            </Button>
          </motion.div>

          <motion.button
            onClick={() => scrollToNext('o-que-e-cdv')}
            className="text-muted-foreground hover:text-foreground transition-colors mt-8"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 mx-auto" />
          </motion.button>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 2: O QUE É O CDV ===== */}
      <AnimatedSlide id="o-que-e-cdv" className="bg-gradient-to-br from-background to-primary/5">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <Shield className="w-5 h-5 mr-2" />
              Certificação Blockchain
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              O que é o <span className="text-primary">CDV?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Um ativo digital que comprova investimento real em reciclagem e educação ambiental
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Card Principal do CDV */}
            <Card className="p-8 border-2 border-primary/20 bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">1 CDV =</h3>
                  <p className="text-primary font-bold text-xl">256 UIBs</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Unidades de Impacto de Base (UIB)</p>
                    <p className="text-sm text-muted-foreground">Cada UIB representa uma ação mensurável de impacto ambiental</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Certificação Digital</p>
                    <p className="text-sm text-muted-foreground">Registro permanente e imutável em blockchain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Validação Pública</p>
                    <p className="text-sm text-muted-foreground">QR Code permite auditoria transparente por qualquer pessoa</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Composição do CDV */}
            <Card className="p-8 bg-gradient-to-br from-card to-primary/5">
              <h3 className="text-2xl font-display font-bold mb-6">Composição de 256 UIBs</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Recycle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Reciclagem</p>
                      <p className="text-sm text-muted-foreground">180 UIBs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">70%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold">Educação Ambiental</p>
                      <p className="text-sm text-muted-foreground">51 UIBs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-secondary">20%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Consumo Consciente</p>
                      <p className="text-sm text-muted-foreground">25 UIBs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">10%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <motion.div className="text-center">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => scrollToNext('como-funciona')}
            >
              Como Funciona na Prática
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 3: COMO FUNCIONA ===== */}
      <AnimatedSlide id="como-funciona" className="bg-gradient-to-br from-secondary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <Zap className="w-5 h-5 mr-2" />
              Processo Simplificado
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Como Funciona o <span className="text-primary">Investimento</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              4 passos simples para gerar impacto real e associar sua marca a ações sustentáveis
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Passo 1 */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border-2 border-primary/20 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Compra do CDV</h3>
                    <p className="text-muted-foreground mb-4">
                      Sua empresa adquire CDVs (lotes de 256 UIBs) diretamente da Ciclik. 
                      Recebe certificação digital com QR Code único.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Coins className="w-3 h-3 mr-1" />
                        Valor Fixo
                      </Badge>
                      <Badge variant="outline">
                        <FileCheck className="w-3 h-3 mr-1" />
                        Certificado
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Passo 2 */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border-2 border-primary/20 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Distribuição de UIBs</h3>
                    <p className="text-muted-foreground mb-4">
                      As 256 UIBs são creditadas na sua conta institucional. Você decide como 
                      distribuir entre clientes, parceiros ou campanhas específicas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        Flexível
                      </Badge>
                      <Badge variant="outline">
                        <Target className="w-3 h-3 mr-1" />
                        Estratégico
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Passo 3 */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border-2 border-primary/20 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Ações Reais</h3>
                    <p className="text-muted-foreground mb-4">
                      Cidadãos usam suas UIBs para reciclar, estudar e fazer compras conscientes. 
                      Cada ação gera impacto mensurável e rastreável.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Recycle className="w-3 h-3 mr-1" />
                        Reciclagem
                      </Badge>
                      <Badge variant="outline">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Educação
                      </Badge>
                      <Badge variant="outline">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Consumo
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Passo 4 */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border-2 border-primary/20 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">Relatórios & Transparência</h3>
                    <p className="text-muted-foreground mb-4">
                      Receba relatórios completos de impacto: kg reciclados, pessoas educadas, 
                      compras conscientes. Use para ESG, marketing e prestação de contas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Relatórios
                      </Badge>
                      <Badge variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        Transparente
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div className="text-center">
            <Button 
              size="lg" 
              onClick={() => scrollToNext('beneficios')}
            >
              Ver Benefícios para sua Empresa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 4: BENEFÍCIOS PARA EMPRESAS ===== */}
      <AnimatedSlide id="beneficios" className="bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <TrendingUp className="w-5 h-5 mr-2" />
              Vantagens Estratégicas
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Benefícios para sua <span className="text-primary">Empresa</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Investimento em CDV vai além do impacto ambiental
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: TrendingUp,
                title: "Relatórios ESG Reais",
                description: "Dados concretos e auditáveis para seus relatórios de sustentabilidade. Não é greenwashing, é impacto mensurável.",
                color: "text-primary"
              },
              {
                icon: Heart,
                title: "Engajamento de Marca",
                description: "Associe sua marca a ações reais de sustentabilidade. Construa reputação positiva com evidências tangíveis.",
                color: "text-destructive"
              },
              {
                icon: Users,
                title: "Fidelização de Clientes",
                description: "Ofereça UIBs como recompensa. Clientes engajados em causas ambientais são mais fiéis à marca.",
                color: "text-secondary"
              },
              {
                icon: FileCheck,
                title: "Compliance Ambiental",
                description: "Demonstre conformidade com regulamentações ambientais através de certificações digitais verificáveis.",
                color: "text-primary"
              },
              {
                icon: Globe,
                title: "Visibilidade ODS",
                description: "Contribua diretamente para 6 Objetivos de Desenvolvimento Sustentável da ONU com comprovação.",
                color: "text-accent"
              },
              {
                icon: BadgeCheck,
                title: "Selo de Transparência",
                description: "QR Code público permite que qualquer pessoa valide o impacto real do seu investimento.",
                color: "text-primary"
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 h-full border-2 border-border hover:border-primary/50 transition-colors">
                  <benefit.icon className={`w-12 h-12 ${benefit.color} mb-4`} />
                  <h3 className="text-xl font-display font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <div className="text-center">
              <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold mb-4">Bônus Exclusivo para Investidores</h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Empresas investidoras recebem acesso prioritário ao dashboard institucional, 
                materiais de marketing personalizados e suporte dedicado da equipe Ciclik.
              </p>
              <Button 
                size="lg"
                onClick={() => scrollToNext('ods')}
              >
                Ver Alinhamento com ODS
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 5: ALINHAMENTO ODS ===== */}
      <AnimatedSlide id="ods" className="bg-gradient-to-br from-background to-accent/5">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <Globe className="w-5 h-5 mr-2" />
              Objetivos de Desenvolvimento Sustentável
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Alinhado com <span className="text-primary">6 ODS</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seu investimento contribui diretamente para metas globais da ONU
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { num: 8, title: "Trabalho Decente e Crescimento Econômico", desc: "Geramos renda para catadores e educadores" },
              { num: 9, title: "Indústria, Inovação e Infraestrutura", desc: "Tecnologia blockchain e inovação em reciclagem" },
              { num: 10, title: "Redução das Desigualdades", desc: "Inclusão social através da economia circular" },
              { num: 11, title: "Cidades e Comunidades Sustentáveis", desc: "Infraestrutura de reciclagem urbana" },
              { num: 12, title: "Consumo e Produção Responsáveis", desc: "Educação para consumo consciente" },
              { num: 13, title: "Ação Contra a Mudança Global do Clima", desc: "Redução de emissões através da reciclagem" },
            ].map((ods, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 h-full border-2 border-border hover:border-primary/50 transition-colors overflow-hidden">
                  <div className="relative mb-4">
                    <img 
                      src={odsImages[ods.num]} 
                      alt={`ODS ${ods.num}`}
                      className="w-full h-24 object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-display font-bold mb-2">ODS {ods.num}</h3>
                  <p className="text-sm font-semibold mb-2">{ods.title}</p>
                  <p className="text-sm text-muted-foreground">{ods.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div className="text-center">
            <Button 
              size="lg" 
              onClick={() => scrollToNext('casos')}
            >
              Ver Casos de Uso
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 6: CASOS DE USO ===== */}
      <AnimatedSlide id="casos" className="bg-gradient-to-br from-secondary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <Target className="w-5 h-5 mr-2" />
              Aplicações Práticas
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="text-primary">Casos de Uso</span> Reais
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Como empresas podem usar CDVs para gerar impacto e engajamento
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Caso 1: Programa de Fidelidade */}
            <Card className="p-8 border-2 border-primary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">Programa de Fidelidade Verde</h3>
                  <Badge variant="outline" className="mt-2">Varejo & E-commerce</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Ofereça UIBs como recompensa em compras. Clientes podem usar para reciclar, 
                estudar ou trocar por descontos. Aumente fidelização e associe marca à sustentabilidade.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>1 UIB a cada R$ 50 em compras</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Cliente usa UIBs na plataforma Ciclik</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Você recebe relatórios de impacto</span>
                </div>
              </div>
            </Card>

            {/* Caso 2: Campanhas de Marketing */}
            <Card className="p-8 border-2 border-secondary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">Campanhas de Engajamento</h3>
                  <Badge variant="outline" className="mt-2">Marketing & Branding</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Crie campanhas onde clientes ganham UIBs ao interagir com sua marca. 
                Transforme ações de marketing em impacto ambiental mensurável.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Sorteio de lotes de UIBs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Ações nas redes sociais</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Eventos e ativações de marca</span>
                </div>
              </div>
            </Card>

            {/* Caso 3: Responsabilidade Social Corporativa */}
            <Card className="p-8 border-2 border-accent/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">Programas de RSC</h3>
                  <Badge variant="outline" className="mt-2">Responsabilidade Social</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Distribua UIBs para comunidades carentes. Permita que famílias gerem renda 
                através da reciclagem e tenham acesso à educação ambiental.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Inclusão social através da reciclagem</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Educação ambiental gratuita</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Impacto social comprovado</span>
                </div>
              </div>
            </Card>

            {/* Caso 4: Compensação de Pegada */}
            <Card className="p-8 border-2 border-primary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <TreePine className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">Compensação Ambiental</h3>
                  <Badge variant="outline" className="mt-2">Eventos & Logística</Badge>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Compense a pegada de carbono de eventos, entregas ou operações. 
                Cada CDV representa ações concretas de reciclagem e educação.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Eventos carbono neutro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Entregas sustentáveis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Relatório de compensação</span>
                </div>
              </div>
            </Card>
          </div>

          <motion.div className="text-center">
            <Button 
              size="lg" 
              onClick={() => scrollToNext('pricing')}
            >
              Ver Modelos de Investimento
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 7: MODELOS DE INVESTIMENTO ===== */}
      <AnimatedSlide id="pricing" className="bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12">
            <Badge className="mb-4 text-lg px-4 py-2">
              <Coins className="w-5 h-5 mr-2" />
              Modelos Flexíveis
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Modelos de <span className="text-primary">Investimento</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Escolha o modelo que melhor se adapta às necessidades da sua empresa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Starter */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 border-2 border-border h-full">
                <div className="text-center mb-6">
                  <Badge className="mb-4">Starter</Badge>
                  <div className="text-4xl font-display font-bold text-foreground mb-2">
                    10 CDVs
                  </div>
                  <p className="text-muted-foreground">2.560 UIBs</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Certificação digital com QR Code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Relatórios mensais de impacto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dashboard institucional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Suporte por email</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Solicitar Proposta
                </Button>
              </Card>
            </motion.div>

            {/* Growth (Destacado) */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 border-2 border-primary shadow-2xl shadow-primary/20 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold rounded-bl-lg">
                  Mais Popular
                </div>
                <div className="text-center mb-6 mt-6">
                  <Badge className="mb-4 bg-primary text-primary-foreground">Growth</Badge>
                  <div className="text-4xl font-display font-bold text-foreground mb-2">
                    50 CDVs
                  </div>
                  <p className="text-muted-foreground">12.800 UIBs</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tudo do Starter, mais:</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Relatórios semanais personalizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Materiais de marketing personalizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Selo de parceiro oficial</span>
                  </li>
                </ul>
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  Solicitar Proposta
                </Button>
              </Card>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 border-2 border-border h-full">
                <div className="text-center mb-6">
                  <Badge className="mb-4">Enterprise</Badge>
                  <div className="text-4xl font-display font-bold text-foreground mb-2">
                    100+ CDVs
                  </div>
                  <p className="text-muted-foreground">25.600+ UIBs</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tudo do Growth, mais:</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Gerente de conta dedicado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Integrações via API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White label customizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">SLA garantido</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  Falar com Especialista
                </Button>
              </Card>
            </motion.div>
          </div>

          <Card className="p-8 bg-gradient-to-r from-accent/10 to-primary/10 border-2 border-accent/20">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-display font-bold mb-2">Valores sob Consulta</h3>
                <p className="text-muted-foreground">
                  Entre em contato para receber uma proposta personalizada com valores e condições especiais 
                  de acordo com o volume de investimento e necessidades da sua empresa.
                </p>
              </div>
              <Button 
                size="lg"
                className="flex-shrink-0"
                onClick={() => scrollToNext('cta-final')}
              >
                Solicitar Proposta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </AnimatedSlide>

      {/* ===== SLIDE 8: CTA FINAL ===== */}
      <AnimatedSlide id="cta-final" className="bg-gradient-to-br from-primary/10 via-background to-accent/10 relative">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Leaf className="w-8 h-8 text-primary/20" />
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Pronto para fazer a <span className="text-primary">diferença real?</span>
          </motion.h2>

          <motion.p
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Junte-se às empresas que estão transformando investimento ambiental 
            em impacto mensurável e transparente.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              <FileCheck className="w-5 h-5 mr-2" />
              Solicitar Proposta Agora
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Eye className="w-5 h-5 mr-2" />
              Rever Apresentação
            </Button>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {[
              { icon: Shield, text: "100% Auditável" },
              { icon: LineChart, text: "Impacto Mensurável" },
              { icon: BadgeCheck, text: "Certificação Digital" },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-4 bg-card/80 backdrop-blur rounded-xl border"
              >
                <item.icon className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="font-semibold">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSlide>
    </div>
  );
};

export default InvestorPresentation;
