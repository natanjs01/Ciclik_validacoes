import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Leaf, Recycle, GraduationCap, ShoppingCart, Award, Users, 
  Building2, TreePine, BarChart3, Target, CheckCircle2,
  ArrowRight, ArrowLeft, ChevronDown, Globe, Shield, TrendingUp, 
  FileCheck, QrCode, LineChart, Coins, Calendar, Lock, Clock,
  BadgeCheck, PieChart, Zap, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Importar imagens ODS como módulos ES6 para funcionamento em produção
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

      {/* Slide 1: Hero para Investidores */}
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
              src={`${import.meta.env.BASE_URL}ciclik-logo-full.png`}
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
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10"
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
                <div className="text-2xl font-display font-bold text-primary">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg px-8"
              onClick={() => navigate('/investidor')}
            >
              <Coins className="w-5 h-5 mr-2" />
              Quero Investir
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="font-display text-lg px-8"
              onClick={() => scrollToNext('oque')}
            >
              Saiba Mais
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => scrollToNext('oque')}
          >
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* Slide 2: O que é o CDV */}
      <AnimatedSlide id="oque" className="bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.span 
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full font-display text-sm mb-4"
              whileInView={{ scale: [0.8, 1] }}
            >
              O Produto
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Como funciona o <span className="text-primary">CDV</span>?
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-3xl mx-auto">
              A Ciclik desenvolve <strong>projetos de sustentabilidade</strong> que geram impacto ambiental 
              real, rastreável e auditável. Cada projeto é dividido em <strong>quotas</strong> que podem 
              ser adquiridas por investidores.
            </p>
          </div>

          {/* Lógica das Quotas */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <motion.div
              className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-3xl border"
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -30 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Cada Quota = R$ 2.000</h3>
                  <p className="text-sm text-muted-foreground">Investimento mínimo por quota</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground font-body">
                  Cada quota adquirida dá direito a <strong>1 CDV</strong> que será emitido quando 
                  o projeto gerar o impacto correspondente:
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Recycle, value: "250 kg", label: "Resíduos Reciclados" },
                    { icon: GraduationCap, value: "5 horas", label: "Educação Ambiental" },
                    { icon: ShoppingCart, value: "1 estudo", label: "Recicla­bilidade" },
                    { icon: Users, value: "~134", label: "Pessoas Impactadas" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="text-center p-4 bg-background/80 rounded-xl"
                      whileInView={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-lg font-display font-bold">{item.value}</div>
                      <div className="text-xs text-muted-foreground hyphens-auto" lang="pt-BR">{item.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-card p-8 rounded-3xl border shadow-lg"
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 30 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Exemplo: Projeto 1.000 Quotas</h3>
                  <p className="text-sm text-muted-foreground">Valor total: R$ 2.000.000</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-body">Resíduos Reciclados</span>
                  <span className="font-display font-bold text-primary">250 toneladas</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-body">Educação Ambiental</span>
                  <span className="font-display font-bold text-primary">5.000 horas</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-body">Estudos de Reciclabilidade</span>
                  <span className="font-display font-bold text-primary">1.000 produtos</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="font-display font-semibold">CDVs Emitidos</span>
                  <span className="font-display font-bold text-2xl text-primary">1.000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-ciclik-orange/10 rounded-lg border border-ciclik-orange/30">
                  <span className="font-display font-semibold">Pessoas Impactadas</span>
                  <span className="font-display font-bold text-2xl text-ciclik-orange">~134 mil</span>
                </div>
              </div>

              {/* Métricas do Ecossistema Ciclik */}
              <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-ciclik-orange/5 rounded-xl border border-primary/10">
                <p className="text-xs text-muted-foreground text-center mb-3 font-body">
                  📊 Ecossistema Ciclik Atual
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-display font-bold text-primary">+4 mil</div>
                    <div className="text-xs text-muted-foreground">CDVs Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-display font-bold text-primary">382 ton</div>
                    <div className="text-xs text-muted-foreground">Reciclado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-display font-bold text-primary">800h</div>
                    <div className="text-xs text-muted-foreground">Educação</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Fluxo do Investidor */}
          <div className="bg-muted/30 p-8 rounded-3xl">
            <h3 className="text-xl font-display font-bold text-center mb-8">
              Jornada do Investidor
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: 1, icon: Eye, title: "Escolha o Projeto", desc: "Analise os projetos Ciclik disponíveis e seus impactos" },
                { step: 2, icon: Coins, title: "Adquira Quotas", desc: "Invista R$ 2.000 por quota no projeto escolhido" },
                { step: 3, icon: Clock, title: "Acompanhe", desc: "Monitore o progresso do impacto em tempo real no dashboard" },
                { step: 4, icon: Award, title: "Receba seu CDV", desc: "Certificado emitido quando o impacto for gerado e auditado" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="relative text-center"
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-display font-bold">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-display font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 -right-3">
                      <ArrowRight className="w-6 h-6 text-primary/30" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* LIR - Lei de Incentivo à Reciclagem */}
          <motion.div
            className="mt-12 p-6 bg-gradient-to-br from-ciclik-green/10 to-ciclik-green/5 rounded-2xl border border-ciclik-green/30"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="p-4 bg-ciclik-green rounded-2xl shrink-0">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-display font-bold text-xl text-ciclik-green mb-2">
                  💰 Incentivo Fiscal via LIR
                </h4>
                <p className="text-muted-foreground font-body">
                  CDVs podem ser adquiridos por meio da <strong className="text-foreground">Lei de Incentivo à Reciclagem (LIR)</strong>, 
                  utilizando um percentual do <strong className="text-foreground">Imposto de Renda devido</strong>. 
                  Consulte a disponibilidade de projetos aprovados pelo <strong className="text-foreground">Ministério do Meio Ambiente</strong>.
                </p>
              </div>
            </div>
          </motion.div>
          {/* ODS - Objetivos de Desenvolvimento Sustentável */}
          <motion.div
            className="mt-12 p-8 bg-gradient-to-br from-ciclik-green/5 to-transparent rounded-2xl border"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="text-center mb-8">
              <h4 className="font-display font-bold text-2xl mb-3">
                🌍 Alinhamento com a Agenda 2030
              </h4>
              <p className="text-muted-foreground font-body max-w-2xl mx-auto">
                Os CDVs Ciclik contribuem diretamente para 6 Objetivos de Desenvolvimento 
                Sustentável da ONU.
              </p>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { num: 8, name: "Trabalho Decente e Crescimento Econômico" },
                { num: 9, name: "Indústria, Inovação e Infraestrutura" },
                { num: 10, name: "Redução das Desigualdades" },
                { num: 11, name: "Cidades e Comunidades Sustentáveis" },
                { num: 12, name: "Consumo e Produção Responsáveis" },
                { num: 13, name: "Ação Contra a Mudança Global do Clima" },
              ].map((ods, i) => (
                <motion.div
                  key={ods.num}
                  className="group relative"
                  whileInView={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                >
                  <img 
                    src={odsImages[ods.num]}
                    alt={`ODS ${ods.num}: ${ods.name}`}
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-white text-xs font-body text-center">{ods.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Destaque */}
          <motion.div
            className="mt-8 p-6 bg-gradient-to-r from-primary to-primary/80 rounded-2xl text-primary-foreground text-center"
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
          >
            <p className="text-lg font-display font-semibold">
              💡 O CDV é emitido apenas quando o impacto ambiental é <strong>efetivamente gerado</strong>, 
              <strong> rastreado</strong> e <strong>auditado</strong> — garantindo total transparência e credibilidade.
            </p>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* Slide 3: Como Funciona */}
      <AnimatedSlide id="como" className="bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span 
              className="inline-block px-4 py-2 bg-secondary/10 text-secondary-foreground rounded-full font-display text-sm mb-4"
              whileInView={{ scale: [0.8, 1] }}
            >
              O Processo
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Como o <span className="text-primary">Impacto</span> é Gerado?
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
              Cada ação de um cidadão no ecossistema Ciclik gera UIBs rastreáveis 
              que são atribuídas ao seu CDV.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { 
                step: 1, 
                icon: Users, 
                title: "Usuário Age", 
                desc: "Recicla, estuda ou registra compras no app Ciclik"
              },
              { 
                step: 2, 
                icon: BarChart3, 
                title: "UIB Gerada", 
                desc: "Sistema registra a Unidade de Impacto Base" 
              },
              { 
                step: 3, 
                icon: Target, 
                title: "Atribuição", 
                desc: "UIB é vinculada ao seu CDV em maturação" 
              },
              { 
                step: 4, 
                icon: FileCheck, 
                title: "Certificado", 
                desc: "Ao completar 256 UIBs, certificado é emitido" 
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="relative"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="bg-card p-6 rounded-2xl border shadow-lg h-full text-center">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6">
                    <ArrowRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Fórmula Visual */}
          <motion.div
            className="bg-card p-8 rounded-2xl border shadow-lg max-w-3xl mx-auto"
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
          >
            <h3 className="text-center font-display font-bold mb-6">Fórmula do CDV</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-primary/10 p-4 rounded-xl text-center">
                <Recycle className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-display font-bold">250 kg</div>
                <div className="text-xs text-muted-foreground">Resíduos</div>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">+</span>
              <div className="bg-blue-500/10 p-4 rounded-xl text-center">
                <GraduationCap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="font-display font-bold">5 horas</div>
                <div className="text-xs text-muted-foreground">Educação</div>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">+</span>
              <div className="bg-secondary/10 p-4 rounded-xl text-center">
                <ShoppingCart className="w-8 h-8 text-secondary mx-auto mb-2" />
                <div className="font-display font-bold">1 produto</div>
                <div className="text-xs text-muted-foreground">Mapeado</div>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">=</span>
              <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-xl text-center text-primary-foreground">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <div className="font-display font-bold">1 CDV</div>
                <div className="text-xs opacity-80">256 UIBs</div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* Slide 4: Benefícios para Empresas */}
      <AnimatedSlide id="beneficios" className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span 
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full font-display text-sm mb-4"
              whileInView={{ scale: [0.8, 1] }}
            >
              Vantagens
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Por que investir em <span className="text-primary">CDV</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Shield, 
                title: "Compliance ESG", 
                desc: "Atenda requisitos regulatórios e de investidores com impacto comprovado",
                color: "primary"
              },
              { 
                icon: BadgeCheck, 
                title: "Marketing Autêntico", 
                desc: "Comunique sustentabilidade com dados reais, não promessas vazias",
                color: "secondary"
              },
              { 
                icon: QrCode, 
                title: "Validação Pública", 
                desc: "Qualquer pessoa pode verificar seu impacto via QR Code",
                color: "primary"
              },
              { 
                icon: LineChart, 
                title: "Dashboard em Tempo Real", 
                desc: "Acompanhe o progresso do seu CDV a qualquer momento",
                color: "blue-500"
              },
              { 
                icon: Globe, 
                title: "Impacto Local", 
                desc: "Apoie cooperativas e comunidades brasileiras diretamente",
                color: "primary"
              },
              { 
                icon: TrendingUp, 
                title: "Valorização de Marca", 
                desc: "Diferenciação competitiva com selo Ciclik - Digital Verde",
                color: "secondary"
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-card p-6 rounded-2xl border shadow-lg"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className={`w-14 h-14 bg-${item.color}/10 rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-7 h-7 text-${item.color}`} />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground font-body text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSlide>

      {/* Slide 5: Dashboard Preview */}
      <AnimatedSlide id="dashboard" className="bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -30 }}
            >
              <motion.span 
                className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full font-display text-sm mb-4"
                whileInView={{ scale: [0.8, 1] }}
              >
                Sua Experiência
              </motion.span>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Dashboard do <span className="text-primary">Investidor</span>
              </h2>
              <p className="text-lg text-muted-foreground font-body mb-8">
                Acompanhe em tempo real o progresso dos seus CDVs, visualize métricas 
                de impacto e emita certificados quando estiverem completos.
              </p>

              <div className="space-y-4">
                {[
                  { icon: PieChart, text: "Progresso detalhado por tipo de impacto" },
                  { icon: Eye, text: "Visibilidade total das UIBs atribuídas" },
                  { icon: Calendar, text: "Acompanhamento do período de maturação" },
                  { icon: FileCheck, text: "Emissão automática de certificados" },
                  { icon: QrCode, text: "QR Codes para validação pública" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4"
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-body">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              whileInView={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.3 }}
            >
              {/* Mock Dashboard */}
              <div className="bg-muted/50 p-6 rounded-3xl border shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}ciclik-logo.png`} alt="Ciclik" className="h-6" />
                    <span className="font-display font-semibold">Meu Portfólio</span>
                  </div>
                  <div className="px-3 py-1 bg-primary/10 rounded-full text-sm text-primary font-medium">
                    3 CDVs Ativos
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4 mb-6">
                  {[
                    { label: "Resíduos", progress: 78, color: "bg-primary", value: "585 kg" },
                    { label: "Educação", progress: 92, color: "bg-blue-500", value: "13,8 h" },
                    { label: "Produtos", progress: 100, color: "bg-[#FBBB1A]", value: "3" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium font-body">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-foreground">{item.value}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.progress === 100 
                              ? 'bg-primary/20 text-primary font-semibold' 
                              : 'text-muted-foreground bg-muted'
                          }`}>
                            {item.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          className={`h-full ${item.color} rounded-full shadow-sm`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.progress}%` }}
                          transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats Cards - valores destacados com ícones */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl text-center border border-primary/20">
                    <div className="text-xl font-display font-bold text-primary">
                      585 kg
                    </div>
                    <div className="text-xs text-muted-foreground font-body">Total Reciclado</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-xl text-center border border-blue-500/20">
                    <div className="text-xl font-display font-bold text-blue-600">
                      13,8 h
                    </div>
                    <div className="text-xs text-muted-foreground font-body">Educação</div>
                  </div>
                  <div className="bg-gradient-to-br from-ciclik-orange/10 to-ciclik-orange/5 p-4 rounded-xl text-center border border-ciclik-orange/20">
                    <div className="text-xl font-display font-bold text-ciclik-orange">
                      3
                    </div>
                    <div className="text-xs text-muted-foreground font-body">Produtos</div>
                  </div>
                </div>
              </div>

              <div className="absolute -z-10 -top-4 -left-4 w-full h-full bg-primary/10 rounded-3xl" />
            </motion.div>
          </div>
        </div>
      </AnimatedSlide>

      {/* Slide 6: Certificado */}
      <AnimatedSlide id="certificado" className="bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span 
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full font-display text-sm mb-4"
              whileInView={{ scale: [0.8, 1] }}
            >
              O Resultado
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Seu <span className="text-primary">Certificado</span> Digital
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
              Ao completar 100% das metas, seu certificado é emitido automaticamente 
              com validação pública via QR Code.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mock Certificate */}
            <motion.div
              className="bg-card p-8 rounded-3xl border shadow-2xl"
              whileInView={{ opacity: 1, rotateY: 0 }}
              initial={{ opacity: 0, rotateY: -15 }}
              transition={{ duration: 0.8 }}
            >
              <div className="border-b pb-6 mb-6">
                <div className="flex items-center justify-between">
                  <img src={`${import.meta.env.BASE_URL}ciclik-logo.png`} alt="Ciclik" className="h-10" />
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Certificado Nº</div>
                    <div className="font-mono text-sm">CDV-2025-00142</div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold mb-2">Certificado Digital Verde</h3>
                <p className="text-sm text-muted-foreground">Ciclik - Digital Verde</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-xl mb-6">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">Empresa Certificada</div>
                  <div className="font-display font-bold text-lg">Sua Empresa LTDA</div>
                  <div className="text-xs text-muted-foreground">CNPJ: 00.000.000/0001-00</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <Recycle className="w-6 h-6 text-primary mx-auto mb-1" />
                  <div className="font-bold">250 kg</div>
                  <div className="text-xs text-muted-foreground">Reciclados</div>
                </div>
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="font-bold">5 horas</div>
                  <div className="text-xs text-muted-foreground">Educação</div>
                </div>
                <div className="text-center p-3 bg-secondary/5 rounded-lg">
                  <TreePine className="w-6 h-6 text-secondary mx-auto mb-1" />
                  <div className="font-bold">425 kg</div>
                  <div className="text-xs text-muted-foreground">CO₂ Evitado</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <div>Emitido em: 05/01/2026</div>
                  <div>Válido permanentemente</div>
                </div>
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <div className="space-y-6">
              {[
                { 
                  icon: Lock, 
                  title: "Imutável e Permanente", 
                  desc: "Uma vez emitido, o certificado é permanente e não pode ser alterado" 
                },
                { 
                  icon: QrCode, 
                  title: "Validação Pública", 
                  desc: "Qualquer pessoa pode escanear o QR Code e verificar a autenticidade" 
                },
                { 
                  icon: Globe, 
                  title: "Compartilhável", 
                  desc: "Link público para incluir em relatórios, sites e materiais de marketing" 
                },
                { 
                  icon: FileCheck, 
                  title: "Download em PDF", 
                  desc: "Baixe o certificado em alta resolução para impressão ou arquivo" 
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex gap-4"
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSlide>

      {/* Slide: Projetos Aprovados MMA/LIR */}
      <AnimatedSlide id="projetos-lir" className="bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.span 
              className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full font-display text-sm mb-4"
              whileInView={{ scale: [0.8, 1] }}
            >
              Aprovados pelo MMA
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Projetos <span className="text-primary">LIR</span> Disponíveis
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-3xl mx-auto">
              Projetos aprovados pelo Ministério do Meio Ambiente elegíveis para captação 
              via Lei de Incentivo à Reciclagem (Lei nº 14.260/2021)
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Projeto 1 - Ciclik Gamificação */}
            <motion.div
              className="bg-card p-8 rounded-3xl border shadow-lg"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-1">
                    MMA e ILZB
                  </Badge>
                  <h3 className="font-display font-bold text-xl">
                    Ciclik Gamificação
                  </h3>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Valor Total</span>
                  <span className="font-display font-bold text-lg">R$ 1.200.000,00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Quotas</span>
                  <span className="font-display font-bold text-primary">600</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Vigência</span>
                  <span className="font-display font-semibold">10/02/2026 - 10/02/2027</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-body">Valor por Quota</span>
                  <span className="font-display font-semibold">R$ 2.000,00</span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl mb-4 min-h-[88px] flex items-center">
                <p className="text-sm text-muted-foreground font-body">
                  Solução que combina tecnologia, economia circular, educação ambiental e justiça social — 
                  com impacto direto na valorização dos catadores, no fortalecimento das cadeias de reciclagem 
                  e na regeneração dos territórios.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-2 bg-primary/5 rounded-lg text-center">
                  <div className="font-semibold">150.000 kg</div>
                  <div className="text-muted-foreground">Resíduos</div>
                </div>
                <div className="p-2 bg-primary/5 rounded-lg text-center">
                  <div className="font-semibold">3.000 min</div>
                  <div className="text-muted-foreground">Educação</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Aprovado pelo Ministério do Meio Ambiente</span>
              </div>
            </motion.div>

            {/* Projeto 2 - Ciclik Conecta */}
            <motion.div
              className="bg-card p-8 rounded-3xl border shadow-lg"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#FBBB1A]/10 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-[#FBBB1A]" />
                </div>
                <div>
                  <Badge variant="outline" className="bg-[#FBBB1A]/5 text-[#FBBB1A] border-[#FBBB1A]/20 mb-1">
                    MMA e ILZB
                  </Badge>
                  <h3 className="font-display font-bold text-xl">
                    Ciclik Conecta
                  </h3>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Valor Total</span>
                  <span className="font-display font-bold text-lg">R$ 3.000.000,00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Quotas</span>
                  <span className="font-display font-bold text-[#FBBB1A]">1.500</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground font-body">Vigência</span>
                  <span className="font-display font-semibold">31/12/2025 - 31/12/2027</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground font-body">Valor por Quota</span>
                  <span className="font-display font-semibold">R$ 2.000,00</span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl mb-4 min-h-[88px] flex items-center">
                <p className="text-sm text-muted-foreground font-body">
                  Implantação de rotas inteligentes de coletas seletivas por meio do programa de 
                  fidelidade ambiental da Ciclik em parceria com cooperativas selecionadas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-2 bg-[#FBBB1A]/10 rounded-lg text-center">
                  <div className="font-semibold">375.000 kg</div>
                  <div className="text-muted-foreground">Resíduos</div>
                </div>
                <div className="p-2 bg-[#FBBB1A]/10 rounded-lg text-center">
                  <div className="font-semibold">7.500 min</div>
                  <div className="text-muted-foreground">Educação</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4 text-[#FBBB1A]" />
                <span>Aprovado pelo Ministério do Meio Ambiente</span>
              </div>
            </motion.div>
          </div>

          {/* Info LIR */}
          <motion.div
            className="mt-12 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-ciclik-orange/5 rounded-2xl border border-primary/10"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-display font-bold text-lg mb-2">
                  Lei de Incentivo à Reciclagem (LIR)
                </h4>
                <p className="text-sm text-muted-foreground font-body">
                  Empresas podem deduzir até <strong>1% do IRPJ</strong> ao investir em projetos 
                  aprovados pelo MMA, transformando tributos em impacto ambiental real e certificado.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* Slide 7: Call to Action */}
      <AnimatedSlide id="cta" className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            whileInView={{ scale: [0.8, 1] }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-12 h-12" />
            </div>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Pronto para Certificar
            <br />o Impacto da sua Empresa?
          </h2>

          <p className="text-xl text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Junte-se às empresas que já estão comprovando seu compromisso 
            ambiental com o Certificado Digital Verde.
          </p>


          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-display text-lg px-8"
              onClick={() => navigate('/investidor')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Investir Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 font-display text-lg px-8"
              onClick={() => navigate('/investidor#projetos')}
            >
              <Eye className="w-5 h-5 mr-2" />
              Ver Projetos Disponíveis
            </Button>
          </div>

          <motion.div 
            className="mt-16 pt-8 border-t border-white/20"
            whileInView={{ opacity: 1 }}
            initial={{ opacity: 0 }}
          >
            <p className="text-primary-foreground/60 font-body text-sm mb-4">
              Dúvidas? Fale com nossa equipe comercial
            </p>
            <p className="font-display text-lg">comercial@ciclik.com.br</p>
          </motion.div>
        </div>
      </AnimatedSlide>

      {/* Footer */}
      <footer className="bg-card py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={`${import.meta.env.BASE_URL}ciclik-logo.png`} alt="Ciclik" className="h-8" />
          <p className="text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} Ciclik. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/apresentacao')}>
              Apresentação Geral
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Voltar ao App
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InvestorPresentation;
