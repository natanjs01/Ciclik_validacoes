import { useRef } from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '@/components/cdv/landing/HeroSection';
import { FAQSection } from '@/components/cdv/landing/FAQSection';
import { CTAFinalSection } from '@/components/cdv/landing/CTAFinalSection';
import { DecorativeLeaves } from '@/components/cdv/landing/DecorativeLeaves';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function CDVLandingInvestor() {
  const navigate = useNavigate();
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInvestClick = (projectId: string) => {
    scrollToCTA();
  };

  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden">
      {/* Sticky Header - Estilo Ciclik */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border/30' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Botão Voltar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/apresentacao')}
            className="font-display font-medium bg-white/90 backdrop-blur-sm hover:bg-white shadow-md rounded-full gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          {/* Logo oficial Ciclik - integrado ao layout */}
          <div className="flex items-center">
            <img 
              src={`${import.meta.env.BASE_URL}logo-with-slogan.png`}
              alt="Ciclik - Recicle e Ganhe" 
              className="h-10 md:h-12 w-auto object-contain"
              style={{ 
                filter: 'drop-shadow(0 0 0 transparent)',
                mixBlendMode: 'normal'
              }}
            />
          </div>
          
          {/* Espaçador para centralizar o logo */}
          <div className="w-20" />
        </div>
      </motion.header>

      {/* Main Content */}
      <main>
        {/* Hero */}
        <HeroSection onCtaClick={scrollToCTA} />

        {/* CTA com Formulário - Logo após Hero */}
        <div ref={ctaRef} className="relative">
          <DecorativeLeaves position="bottom-left" size="lg" opacity={0.12} rotate={15} flip />
          <DecorativeLeaves position="top-right" size="md" opacity={0.1} rotate={-25} />
          <CTAFinalSection />
        </div>



        {/* FAQ */}
        <div id="faq" className="relative">
          <DecorativeLeaves position="top-right" size="md" opacity={0.08} rotate={-20} />
          <FAQSection />
        </div>

      </main>

      {/* Footer - Estilo Ciclik */}
      <footer className="bg-gradient-to-b from-muted/30 to-muted/50 border-t border-border/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <img 
                src={`${import.meta.env.BASE_URL}logo-with-slogan.png`}
                alt="Ciclik - Recicle e Ganhe" 
                className="h-14 w-auto object-contain mb-5"
              />
              <p className="font-body text-muted-foreground text-sm max-w-md leading-relaxed">
                Mais do que uma plataforma de benefícios, somos um movimento de 
                transformação de comportamentos. Uma comunidade onde você recicla e todos ganham.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-5">Links</h4>
              <ul className="space-y-3 text-sm font-body text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors inline-flex items-center gap-2">
                    Sobre a Ciclik
                  </a>
                </li>
                <li>
                  <a href="#projetos" className="hover:text-primary transition-colors inline-flex items-center gap-2">
                    Projetos CDV
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-primary transition-colors inline-flex items-center gap-2">
                    Perguntas Frequentes
                  </a>
                </li>
                <li>
                  <a href="/cdv/investor" className="hover:text-primary transition-colors inline-flex items-center gap-2">
                    Área do Investidor
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-5">Contato</h4>
              <ul className="space-y-3 text-sm font-body text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✉️</span>
                  investidores@ciclik.com.br
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">📱</span>
                  (11) 99999-9999
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-body text-muted-foreground">
              © {new Date().getFullYear()} Ciclik. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm font-body text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button - Estilo Ciclik */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showScrollTop ? 1 : 0, 
          scale: showScrollTop ? 1 : 0.8,
          pointerEvents: showScrollTop ? 'auto' : 'none'
        }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-primary hover:brightness-105 shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={scrollToTop}
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
}