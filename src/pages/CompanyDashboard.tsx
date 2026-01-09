import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  Building2, 
  BarChart3, 
  LogOut, 
  TrendingUp, 
  Leaf, 
  Package, 
  Users,
  Calendar,
  ArrowRight,
  Activity,
  Shield,
  Target
} from 'lucide-react';

export default function CompanyDashboard() {
  const { user, profile, signOut } = useAuth();
  const [empresa, setEmpresa] = useState<any>(null);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadEmpresa(), loadLatestMetrics()]);
    setLoading(false);
  };

  const loadEmpresa = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('empresas')
      .select('*, profiles:id_user (nome, cnpj)')
      .eq('id_user', user.id)
      .single();
    
    if (data) setEmpresa(data);
  };

  const loadLatestMetrics = async () => {
    if (!user) return;

    const { data: empresaData } = await supabase
      .from('empresas')
      .select('id')
      .eq('id_user', user.id)
      .single();

    if (!empresaData) return;

    const { data } = await supabase
      .from('metricas_empresas')
      .select('*')
      .eq('id_empresa', empresaData.id)
      .order('data_registro', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setLatestMetrics(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Leaf className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full border-2 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Empresa não encontrada</CardTitle>
              <CardDescription>
                Sua conta não está vinculada a nenhuma empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={signOut} className="w-full" variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4 md:p-8">
      <motion.div 
        className="mx-auto max-w-7xl space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 shadow-lg bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {profile?.nome?.charAt(0) || 'E'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold">{profile?.nome}</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Painel Empresarial
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/company/own-metrics')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Minhas Métricas
                  </Button>
                  <Button variant="ghost" size="icon" onClick={signOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={itemVariants}
        >
          <Card className="border-2 hover:border-primary/50 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo de Empresa</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold capitalize mb-1">
                {empresa.tipo_empresa}
              </div>
              <Badge variant="secondary" className="text-xs">
                {empresa.plano_atual || 'Plano Básico'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Verde</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-green-600">
                {latestMetrics?.percentual_faturamento_verde
                  ? `${latestMetrics.percentual_faturamento_verde.toFixed(1)}%`
                  : '0%'}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Última atualização
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Recuperação</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-blue-600">
                {latestMetrics?.taxa_recuperacao
                  ? `${latestMetrics.taxa_recuperacao.toFixed(1)}%`
                  : '0%'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Eficiência de reciclagem
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Shield className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-2xl font-display font-bold">Ativo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Compliance verificado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                Acesse as principais funcionalidades da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate('/company/metrics')}
                  className="h-auto py-4 justify-start"
                  variant="outline"
                >
                  <div className="flex items-start gap-3 text-left">
                    <BarChart3 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Métricas Detalhadas</div>
                      <div className="text-xs text-muted-foreground">
                        Visualize relatórios completos de desempenho
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5" />
                </Button>

                <Button
                  onClick={() => navigate('/company/own-metrics')}
                  className="h-auto py-4 justify-start"
                  variant="outline"
                >
                  <div className="flex items-start gap-3 text-left">
                    <Package className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Minhas Métricas</div>
                      <div className="text-xs text-muted-foreground">
                        Gerencie suas metas e indicadores
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">CNPJ</span>
                  <p className="text-lg font-mono font-semibold">{empresa.profiles?.cnpj || 'Não informado'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Tipo de Empresa</span>
                  <p className="text-lg font-semibold capitalize">{empresa.tipo_empresa}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Plano Atual</span>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{empresa.plano_atual || 'Plano Básico'}</p>
                  <Badge variant="outline" className="text-xs">
                    <Leaf className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </div>

              {latestMetrics && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Última Atualização de Métricas</span>
                    <p className="text-lg font-semibold">
                      {new Date(latestMetrics.data_registro).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Summary */}
        {latestMetrics && (
          <motion.div variants={itemVariants}>
            <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  Resumo de Impacto Ambiental
                </CardTitle>
                <CardDescription>
                  Suas contribuições para a sustentabilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Impacto Social</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {latestMetrics.percentual_faturamento_verde?.toFixed(0) || '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Faturamento Verde</p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-secondary" />
                      <span className="text-sm text-muted-foreground">Reciclagem</span>
                    </div>
                    <p className="text-2xl font-bold text-secondary">
                      {latestMetrics.taxa_recuperacao?.toFixed(0) || '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de Recuperação</p>
                  </div>

                  <div className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Crescimento</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">+15%</p>
                    <p className="text-xs text-muted-foreground mt-1">vs. mês anterior</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
