import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Leaf, Recycle, BookOpen, ScanLine, Award, Users, 
  Building2, Truck, Shield, TrendingUp, CheckCircle2,
  ArrowRight, Gift, XCircle, Heart, QrCode, BarChart3,
  Megaphone, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

// Contador animado
const AnimatedCounter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      let start = 0;
      const duration = 2;
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
  }, [isInView, end]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString('pt-BR')}{suffix}</span>;
};

const InstitutionalPresentation = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      
      {/* ===== SEÇÃO 1: HERO ===== */}
      <section className="relative py-20 px-4 md:px-8 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Logo */}
          <motion.img
            src={`${import.meta.env.BASE_URL}ciclik-logo-full.png`}
            alt="Ciclik"
            className="h-24 mx-auto mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          />

          {/* Headline impactante */}
          <motion.h1
            className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            A reciclagem no Brasil{" "}
            <span className="text-destructive">não funciona.</span>
            <br />
            <span className="text-primary">Nós criamos o método definitivo que vai fazer funcionar.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Um programa de fidelidade ambiental que transforma cidadãos em agentes de mudança 
            e empresas em patrocinadoras de impacto real.{" "}
            <span className="font-display italic text-accent">Assim ajudamos todo mundo a ajudar o mundo!</span>
          </motion.p>

          {/* Diferenciais */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { icon: Shield, text: "100% Auditável" },
              { icon: Recycle, text: "3 Módulos Integrados" },
              { icon: Award, text: "Único no Brasil" },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Frase motivacional */}
          <motion.p
            className="text-muted-foreground text-lg mb-6 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Faça parte do movimento que está reinventando a economia circular no Brasil.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
              <Leaf className="w-5 h-5 mr-2" />
              Participar e Ganhar Pontos
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => { window.scrollTo(0, 0); navigate('/investidor'); }}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Patrocinar Impacto Real
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO 2: O PROBLEMA ===== */}
      <section className="py-20 px-4 md:px-8 bg-card">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
              Por que a reciclagem <span className="text-destructive">não funciona</span> no Brasil?
            </h2>
            <p className="text-muted-foreground text-lg">
              Menos de 4% dos resíduos recicláveis são efetivamente reciclados.
            </p>
          </motion.div>

          {/* Problema vs Solução */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problemas */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-destructive/30 bg-destructive/5">
                <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <XCircle className="w-6 h-6" />
                  O Problema
                </h3>
                <ul className="space-y-4">
                  {[
                    "Falta educação ambiental acessível",
                    "Ninguém sabe o que é reciclável de verdade",
                    "Não há incentivo real para reciclar",
                    "Impactos ambientais são impossíveis de rastrear",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Solução */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 border-primary/30 bg-primary/5">
                <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                  A Solução Ciclik
                </h3>
                <ul className="space-y-4">
                  {[
                    "Missões educativas que ensinam na prática",
                    "Análise de reciclabilidade via nota fiscal",
                    "Pontos que viram benefícios reais",
                    "Cada ação gera um UIB (Unidade de Impacto) rastreável",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 3: ECONOMIA CIRCULAR ===== */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
              O Ciclo <span className="text-primary">Completo</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Um ecossistema que conecta empresas, pessoas e cooperativas.
            </p>
          </motion.div>

          {/* Ciclo Visual */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Building2,
                  title: "Empresas",
                  subtitle: "Investem",
                  desc: "Financiam ações reais de sustentabilidade",
                  color: "bg-accent"
                },
                {
                  icon: Users,
                  title: "Usuários",
                  subtitle: "Agem",
                  desc: "Aprendem, consomem consciente e entregam recicláveis",
                  color: "bg-primary"
                },
                {
                  icon: Heart,
                  title: "Cooperativas",
                  subtitle: "Transformam",
                  desc: "Recebem materiais e geram renda para catadores",
                  color: "bg-green-600"
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className={`w-20 h-20 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                  <p className="text-primary font-medium text-sm mb-2">{item.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Setas conectoras (desktop) */}
            <div className="hidden md:flex absolute top-10 left-1/2 transform -translate-x-1/2 w-2/3 justify-around">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <ArrowRight className="w-8 h-8 text-primary/50" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <ArrowRight className="w-8 h-8 text-primary/50" />
              </motion.div>
            </div>
          </div>

          {/* Resultado */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
              <Recycle className="w-6 h-6 text-primary" />
              <span className="font-medium text-foreground">
                = <span className="text-primary font-bold">Impacto Real Certificado</span> (CDV)
              </span>
            </div>
            <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
              100% dos resíduos vão para cooperativas de catadores. 
              Sua ação não apenas recicla — <span className="text-primary font-medium">ela transforma vidas.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO 4: ECOSSISTEMA - USUÁRIOS E EMPRESAS LADO A LADO ===== */}
      <section className="py-20 px-4 md:px-8 bg-card">
        <div className="max-w-6xl mx-auto">
          {/* Grid lado a lado */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Coluna Esquerda - Para Você */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full text-primary text-sm font-medium mb-4">
                <Users className="w-4 h-4" />
                Para Você
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Como Você <span className="text-primary">Participa</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Recicle, aprenda e ganhe. Simples assim.
              </p>

              {/* 4 Passos - Grid 2x2 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: BookOpen, step: "1", title: "Aprenda", desc: "Missões de educação ambiental", color: "bg-blue-500" },
                  { icon: ScanLine, step: "2", title: "Registre", desc: "Escaneie notas fiscais", color: "bg-purple-500" },
                  { icon: Truck, step: "3", title: "Entregue", desc: "Leve às cooperativas", color: "bg-primary" },
                  { icon: Gift, step: "4", title: "Ganhe", desc: "Troque por descontos", color: "bg-accent" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="p-4 h-full text-center hover:shadow-md transition-shadow">
                      <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">PASSO {item.step}</div>
                      <h3 className="font-display text-sm font-semibold mb-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-tight">{item.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Reciprocidade compacta */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 mb-6">
                <p className="text-sm font-medium text-foreground text-center">
                  <span className="text-primary font-semibold">Quanto mais você recicla,</span>{" "}
                  mais você ganha.
                </p>
              </div>

              {/* Spacer para alinhar botões */}
              <div className="flex-grow" />

              {/* CTA */}
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white font-display mt-auto"
                onClick={() => navigate("/auth")}
              >
                Cadastre Grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {/* Coluna Direita - Para Empresas */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/20 rounded-full text-accent text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                Para Empresas
              </div>
              
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Por Que <span className="text-primary">Investir</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Patrocine impacto real e comprove resultados.
              </p>

              {/* Benefícios como lista */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: Award, title: "Certificado Digital Verde (CDV)", desc: "QR Code público e verificável" },
                  { icon: BarChart3, title: "Dashboard em Tempo Real", desc: "Acompanhe kg, horas e famílias" },
                  { icon: Megaphone, title: "Marketing Verde Autêntico", desc: "Comunicação baseada em dados" },
                  { icon: FileCheck, title: "Compliance ESG", desc: "Relatórios auditáveis" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:border-primary/30 transition-colors"
                  >
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-semibold truncate">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Urgência simplificada + LIR */}
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold">Projetos Disponíveis via LIR</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Invista até <span className="font-semibold text-primary">1% do seu Imposto de Renda</span> em projetos aprovados pelo MMA.
                </p>
              </div>

              {/* CTA */}
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-white font-display"
                onClick={() => navigate("/investidor")}
              >
                Consulte Condições
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>

          {/* Linha de Autoridade - Compartilhada */}
          <motion.div
            className="mt-12 pt-8 border-t flex flex-wrap justify-center gap-6 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="w-5 h-5 text-primary" />
              Validação pública por QR Code
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Auditoria independente
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCheck className="w-5 h-5 text-primary" />
              Projetos aprovados pelo MMA
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== SEÇÃO 5: CTA FINAL ===== */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-card to-background">
        <div className="max-w-5xl mx-auto">
          {/* CTA Final */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
                Faça Parte da Revolução
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Faça parte do movimento que está reinventando a economia circular no Brasil.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
                  <Leaf className="w-5 h-5 mr-2" />
                  Participar e Ganhar Pontos
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={() => { window.scrollTo(0, 0); navigate('/investidor'); }}
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Patrocinar Impacto Real
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Footer simples */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>contato@ciclik.com.br • ciclik.com.br</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InstitutionalPresentation;
