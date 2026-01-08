import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Award, BarChart3, FileCheck, Shield, Link2, Building2, QrCode, FileSpreadsheet } from 'lucide-react';

const benefits = [
  {
    icon: Award,
    title: 'Selo "Ciclik - Digital Verde"',
    description: 'Direito de uso da marca e selo para comunicação da sua empresa como investidora em impactos ambientais reais.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Exclusivo',
    description: 'Acompanhe em tempo real o progresso das suas quotas, impactos gerados e status dos certificados.',
  },
  {
    icon: FileCheck,
    title: 'Certificado Digital',
    description: 'CDV com QR code validável publicamente, contendo todos os impactos atribuídos à sua marca.',
  },
  {
    icon: Shield,
    title: 'Compliance ESG',
    description: 'Relatórios formatados para uso em documentação ESG, relatórios de sustentabilidade e auditorias.',
  },
  {
    icon: Link2,
    title: 'Rastreabilidade Total',
    description: 'Cada kg, cada minuto, cada produto é rastreável até a origem: cooperativa, usuário, data e hora.',
  },
  {
    icon: Building2,
    title: 'Múltiplos Projetos',
    description: 'Invista em diferentes projetos com públicos-alvo específicos e diversifique seus impactos ambientais.',
  },
  {
    icon: QrCode,
    title: 'Validação Pública',
    description: 'Qualquer pessoa pode escanear o QR code do certificado e verificar a autenticidade dos impactos.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Exportação de Dados',
    description: 'Exporte relatórios detalhados em PDF e Excel para uso interno, auditoria ou comunicação externa.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5 }
  },
};

export function BenefitsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            Benefícios Exclusivos
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            O Que Sua Marca Recebe
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Além dos impactos ambientais certificados, investidores CDV têm acesso 
            a uma série de benefícios exclusivos para maximizar o valor do investimento.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                boxShadow: "0 20px 40px rgba(139, 195, 74, 0.15)",
                transition: { duration: 0.3 } 
              }}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Highlight Box */}
        <motion.div
          className="mt-16 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-white">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Icon */}
              <div className="flex-shrink-0">
                <motion.div
                  className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <Award className="w-12 h-12 text-white" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Ciclik - Digital Verde Certificado
              </h3>
              <p className="text-white/90 text-lg mb-6">
                Sua empresa pode usar o selo "Ciclik - Digital Verde" em materiais de comunicação,
                  relatórios de sustentabilidade e campanhas de marketing. Um diferencial 
                  competitivo baseado em impactos reais e verificáveis.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                    ✓ Uso em marketing
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                    ✓ Relatórios ESG
                  </span>
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                    ✓ Auditorias
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
