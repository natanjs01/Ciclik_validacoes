import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Users, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectsCatalogProps {
  onInvestClick: (projectId: string) => void;
}

export function ProjectsCatalog({ onInvestClick }: ProjectsCatalogProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['cdv-projects-landing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cdv_projetos')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
            Projetos Disponíveis
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Invista em Impacto Real
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o projeto que mais se alinha com os valores da sua marca 
            e comece a gerar impactos ambientais certificados.
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Erro ao carregar projetos</p>
          </div>
        )}

        {/* Projects Grid */}
        {projects && projects.length > 0 && (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {projects.map((project, index) => {
              const quotasDisponiveis = (project.total_quotas || 0) - (project.quotas_vendidas || 0);
              const progressPercent = project.total_quotas 
                ? ((project.quotas_vendidas || 0) / project.total_quotas) * 100 
                : 0;
              const isAlmostSoldOut = quotasDisponiveis <= 10 && quotasDisponiveis > 0;

              return (
                <motion.div
                  key={project.id}
                  className="group relative bg-card rounded-3xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -5 }}
                >
                  {/* Scarcity Badge */}
                  {isAlmostSoldOut && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                        Últimas {quotasDisponiveis} quotas!
                      </Badge>
                    </div>
                  )}

                  {/* Header gradient */}
                  <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/60 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/ciclik-logo.png')] bg-center bg-no-repeat opacity-10" />
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6 -mt-8 relative z-10">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {project.titulo}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.descricao}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          {project.total_quotas || 0} quotas
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          {project.publico_alvo || 'Geral'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          {format(new Date(project.data_inicio), "MMM/yyyy", { locale: ptBR })} - {format(new Date(project.data_fim), "MMM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Quotas vendidas</span>
                        <span className="font-semibold text-foreground">
                          {project.quotas_vendidas || 0}/{project.total_quotas || 0}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={progressPercent} className="h-2" />
                        {progressPercent > 70 && (
                          <motion.div
                            className="absolute inset-0 bg-primary/20 rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(2000)}
                        </div>
                        <div className="text-xs text-muted-foreground">por quota</div>
                      </div>
                      <Button
                        onClick={() => onInvestClick(project.id)}
                        disabled={quotasDisponiveis === 0}
                        className="group/btn"
                      >
                        {quotasDisponiveis === 0 ? 'Esgotado' : 'Investir'}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {projects && projects.length === 0 && (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <Target className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Novos projetos em breve
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos preparando novos projetos de impacto ambiental. 
              Cadastre-se para ser notificado quando estiverem disponíveis.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
