import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Leaf, Mail, Building2, Phone, User, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function CTAFinalSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    empresa: '',
    telefone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('cdv_leads')
        .insert({
          nome: formData.nome,
          email: formData.email,
          empresa: formData.empresa,
          telefone: formData.telefone || null,
          origem: 'landing_cdv'
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Recebemos seu interesse! Entraremos em contato em breve.');
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      toast.error('Erro ao enviar. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      className="py-24 relative overflow-hidden" 
      ref={ref}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80"
        animate={{
          background: [
            'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.9) 50%, hsl(var(--primary)/0.8) 100%)',
            'linear-gradient(135deg, hsl(var(--primary)/0.8) 0%, hsl(var(--primary)) 50%, hsl(var(--primary)/0.9) 100%)',
            'linear-gradient(135deg, hsl(var(--primary)/0.9) 0%, hsl(var(--primary)/0.8) 50%, hsl(var(--primary)) 100%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 text-sm mb-6"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Leaf className="w-4 h-4" />
              Comece a gerar impacto hoje
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Transforme Investimento
              <br />
              em Impacto Real
            </h2>
            
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Preencha o formulário e nossa equipe entrará em contato 
              para apresentar os projetos disponíveis e tirar suas dúvidas.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {submitted ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: 3 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Obrigado pelo seu interesse!
                </h3>
                <p className="text-white/80">
                  Nossa equipe entrará em contato em até 24 horas úteis.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-white">
                      Nome completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <Input
                        id="nome"
                        placeholder="Seu nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      E-mail corporativo
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                      />
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-white">
                      Empresa
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <Input
                        id="empresa"
                        placeholder="Nome da empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        required
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-white">
                      Telefone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-white text-primary hover:bg-white/90 text-lg py-6 rounded-xl group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Quero Ser Investidor
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-center text-white/60 text-sm">
                  Ao enviar, você concorda em receber comunicações da Ciclik. 
                  Não compartilhamos seus dados com terceiros.
                </p>
              </form>
            )}
          </motion.div>

          {/* Alternative CTA */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <p className="text-white/70">
              Prefere conversar diretamente?{' '}
              <a 
                href="mailto:investidores@ciclik.com.br" 
                className="text-white hover:underline font-semibold"
              >
                investidores@ciclik.com.br
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
