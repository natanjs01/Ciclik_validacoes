import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Trophy, 
  Gift, 
  Recycle, 
  Building2,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  HelpCircle,
  Package,
  Route,
  Target,
  FileCheck
} from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import TourGuide from '@/components/TourGuide';
import { useTour } from '@/hooks/useTour';
import { Step } from 'react-joyride';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({
    usuarios: 0,
    missoes: 0,
    cupons: 0,
    cooperativas: 0,
    empresas: 0,
    entregas: 0
  });
  const navigate = useNavigate();
  
  const { run, completeTour, setRun } = useTour({ 
    tourKey: 'admin_dashboard',
    autoStart: true 
  });

  const tourSteps: Step[] = [
    {
      target: '.tour-admin-header',
      content: 'Bem-vindo ao Painel Administrativo! Aqui você tem controle total do sistema ReciclaAí.',
      disableBeacon: true,
    },
    {
      target: '.tour-admin-stats',
      content: 'Veja estatísticas gerais: total de usuários, missões, cupons, cooperativas, empresas e entregas registradas.',
    },
    {
      target: '.tour-admin-docs',
      content: 'Gere documentação completa em PDF com todas as funcionalidades do sistema para referência.',
    },
    {
      target: '.tour-admin-missions',
      content: 'Crie e gerencie missões educativas que os usuários podem completar para ganhar pontos.',
    },
    {
      target: '.tour-admin-users',
      content: 'Visualize e edite informações dos usuários, incluindo pontuação e nível.',
    },
    {
      target: '.tour-admin-kpis',
      content: 'Acesse relatórios detalhados e KPIs do sistema com análises comparativas e filtros geográficos.',
    },
  ];

  const handleTourCallback = () => {
    completeTour();
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Buscar usuários válidos (com documentos completos)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, tipo_pessoa, cpf, cnpj, email, created_at, data_cadastro')
      .not('email', 'is', null)
      .not('nome', 'is', null);
    
    const validUsers = allProfiles?.filter(user => 
      (user.tipo_pessoa === 'PF' && user.cpf && user.cpf.length >= 11) ||
      (user.tipo_pessoa === 'PJ' && user.cnpj && user.cnpj.length >= 14)
    ) || [];

    // Remover duplicatas: manter apenas o registro mais recente por email/CPF/CNPJ
    const uniqueUsers = validUsers.reduce((acc: any[], current) => {
      const identifier = current.tipo_pessoa === 'PF' ? current.cpf : current.cnpj;
      
      const existingIndex = acc.findIndex(user => {
        const existingId = user.tipo_pessoa === 'PF' ? user.cpf : user.cnpj;
        return existingId === identifier || user.email === current.email;
      });
      
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        const existing = acc[existingIndex];
        const existingDate = new Date(existing.created_at || existing.data_cadastro);
        const currentDate = new Date(current.created_at || current.data_cadastro);
        
        if (currentDate > existingDate) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []);

    const [missoes, cupons, cooperativas, empresas, entregas] = await Promise.all([
      supabase.from('missoes').select('id', { count: 'exact', head: true }),
      supabase.from('cupons').select('id', { count: 'exact', head: true }),
      supabase.from('cooperativas').select('id', { count: 'exact', head: true }),
      supabase.from('empresas').select('id', { count: 'exact', head: true }),
      supabase.from('entregas_reciclaveis').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      usuarios: uniqueUsers.length,
      missoes: missoes.count || 0,
      cupons: cupons.count || 0,
      cooperativas: cooperativas.count || 0,
      empresas: empresas.count || 0,
      entregas: entregas.count || 0,
    });
  };

  const menuItems = [
    {
      title: 'Documentação do Sistema',
      description: 'Gerar e visualizar documentação completa',
      icon: FileText,
      color: 'warning',
      path: '/admin/documentation'
    },
    {
      title: 'Gestão de Termos de Uso',
      description: 'Gerenciar termos, políticas e aceites',
      icon: FileCheck,
      color: 'primary',
      path: '/admin/termos'
    },
    {
      title: 'Gestão de Missões',
      description: 'Criar e gerenciar missões',
      icon: Trophy,
      color: 'primary',
      path: '/admin/missions'
    },
    {
      title: 'Gestão de Cupons',
      description: 'Importar e gerenciar cupons',
      icon: Gift,
      color: 'accent',
      path: '/admin/coupons'
    },
    {
      title: 'Gestão de Operadores Logísticos',
      description: 'Cooperativas, Rotas Ciclik e Operadores',
      icon: Recycle,
      color: 'success',
      path: '/admin/operadores-logisticos'
    },
    {
      title: 'Gestão de Rotas de Coleta',
      description: 'Configurar rotas, áreas e adesões',
      icon: Route,
      color: 'primary',
      path: '/admin/rotas'
    },
    {
      title: 'Interesses por Funcionalidade',
      description: 'Demanda de usuários por localidade',
      icon: Target,
      color: 'warning',
      path: '/admin/interesses'
    },
    {
      title: 'Gestão de Empresas',
      description: 'Gerenciar empresas parceiras e métricas',
      icon: Building2,
      color: 'secondary',
      path: '/admin/companies'
    },
    {
      title: 'Gestão CDV',
      description: 'Certificados Digitais Verdes e reconciliação',
      icon: Trophy,
      color: 'success',
      path: '/admin/cdv'
    },
    {
      title: 'Gestão de Produtos',
      description: 'Cadastro de produtos Ciclik com GTIN e NCM',
      icon: Package,
      color: 'primary',
      path: '/admin/products'
    },
    {
      title: 'Relatório de Produtos',
      description: 'Produtos não cadastrados nas notas fiscais',
      icon: TrendingUp,
      color: 'warning',
      path: '/admin/products/report'
    },
    {
      title: 'Gestão de Usuários',
      description: 'Ver e editar usuários',
      icon: Users,
      color: 'muted',
      path: '/admin/users'
    },
    {
      title: 'KPIs e Relatórios',
      description: 'Visualizar métricas gerais',
      icon: BarChart3,
      color: 'warning',
      path: '/admin/kpis'
    },
    {
      title: 'Configurações do Sistema',
      description: 'Gerenciar configurações globais',
      icon: Settings,
      color: 'secondary',
      path: '/admin/settings'
    },
    {
      title: 'Gestão de Gamificação',
      description: 'Configurar pontos de atividades',
      icon: Trophy,
      color: 'primary',
      path: '/admin/gamification'
    },
    {
      title: 'Auditoria de Pontos',
      description: 'Relatório de discrepâncias e recálculo',
      icon: BarChart3,
      color: 'warning',
      path: '/admin/points-audit'
    },
    {
      title: 'Promessas de Entrega',
      description: 'Rastreamento de entregas via QR Code',
      icon: Package,
      color: 'primary',
      path: '/admin/delivery-promises'
    },
  ];

  return (
    <PageTransition>
      <TourGuide 
        steps={tourSteps} 
        run={run} 
        onComplete={handleTourCallback}
        onSkip={handleTourCallback}
      />
      
      <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between tour-admin-header">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Ciclik Digital Verde</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRun(true)}
              className="hidden md:flex gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Tour Guiado
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 tour-admin-stats">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Usuários</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {stats.usuarios}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Missões</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {stats.missoes}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Cupons</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                {stats.cupons}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Operadores</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Recycle className="h-5 w-5 text-success" />
                {stats.cooperativas}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Empresas</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-secondary-foreground" />
                {stats.empresas}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Entregas</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-warning" />
                {stats.entregas}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item, index) => (
            <Card 
              key={item.path}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                index === 0 ? 'tour-admin-docs' : 
                index === 2 ? 'tour-admin-missions' :
                index === 5 ? 'tour-admin-users' :
                index === 6 ? 'tour-admin-kpis' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-${item.color}/10 p-3`}>
                    <item.icon className={`h-8 w-8 text-${item.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}