import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Quanto custa uma quota CDV?',
    answer: 'Cada quota CDV custa R$ 2.000. Esse valor garante à sua marca o direito a 250kg de resíduos reciclados, 5 minutos de educação ambiental e 1 produto catalogado, todos rastreáveis e certificados.',
  },
  {
    question: 'Qual o prazo para receber os impactos?',
    answer: 'O prazo varia de acordo com o projeto escolhido. A maioria dos projetos tem prazo de maturação de 12 a 24 meses. Durante esse período, você acompanha o progresso em tempo real pelo dashboard exclusivo.',
  },
  {
    question: 'Como verifico a autenticidade do certificado?',
    answer: 'Cada CDV possui um QR code único que, ao ser escaneado, direciona para uma página pública de validação. Qualquer pessoa pode verificar os impactos, datas e rastreabilidade completa do certificado.',
  },
  {
    question: 'Posso investir em múltiplos projetos?',
    answer: 'Sim! Você pode adquirir quotas em quantos projetos desejar. Isso permite diversificar seus impactos ambientais e apoiar diferentes públicos-alvo e regiões.',
  },
  {
    question: 'Como uso os impactos para relatórios ESG?',
    answer: 'Oferecemos relatórios formatados especificamente para uso em documentação ESG. Você pode exportar dados em PDF e Excel, incluindo certificados, rastreabilidade e métricas detalhadas de impacto.',
  },
  {
    question: 'O que acontece se o projeto não atingir 100%?',
    answer: 'Trabalhamos com projeções baseadas no histórico do ecossistema Ciclik. Em caso de atrasos, você é notificado e pode acompanhar o progresso em tempo real. Projetos com risco de atraso são sinalizados no dashboard.',
  },
  {
    question: 'Posso usar o selo "Investidor Ciclik"?',
    answer: 'Sim! Ao adquirir quotas CDV, sua empresa recebe o direito de uso do selo "Investidor Ciclik" em materiais de comunicação, campanhas de marketing e relatórios de sustentabilidade.',
  },
  {
    question: 'Como funciona a rastreabilidade?',
    answer: 'Cada unidade de impacto (UIB) é rastreável até a origem: você pode ver qual cooperativa recebeu os resíduos, qual usuário assistiu ao conteúdo educativo, e qual produto foi catalogado. Tudo com data, hora e localização.',
  },
];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Perguntas Frequentes
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Tire Suas Dúvidas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Encontre respostas para as perguntas mais comuns sobre 
            investimento em CDV e impactos ambientais certificados.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors py-5 [&[data-state=open]]:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-muted-foreground">
            Não encontrou o que procurava?{' '}
            <a href="mailto:contato@ciclik.com.br" className="text-primary hover:underline font-semibold">
              Entre em contato conosco
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
