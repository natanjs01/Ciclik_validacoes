import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CooperativeDeliveryCard } from '@/components/CooperativeDeliveryCard';
import TourGuide from '@/components/TourGuide';
import { useTour } from '@/hooks/useTour';
import { toast } from 'sonner';
import { 
  Recycle, 
  Package, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  QrCode,
  FileText,
  LogOut,
  Star,
  AlertCircle,
  HelpCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatWeight } from '@/lib/formatters';

export default function CooperativeDashboard() {
  const { user, profile, signOut } = useAuth();
  const [cooperativa, setCooperativa] = useState<any>(null);
  const [entregasPrevistas, setEntregasPrevistas] = useState<any[]>([]);
  const [entregasEmColeta, setEntregasEmColeta] = useState<any[]>([]);
  const [entregasRealizadas, setEntregasRealizadas] = useState<any[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalEntregas: 0,
    entregasPendentes: 0,
    entregasEmColeta: 0,
    pesoTotal: 0,
    pontuacao: 100,
    entregasMes: 0
  });
  const navigate = useNavigate();

  const { run, completeTour, startTour } = useTour({
    tourKey: 'cooperative-welcome',
    autoStart: true
  });

  const tourSteps = [
    {
      target: 'body',
      content: 'Bem-vindo ao seu Painel do Operador! Vamos fazer um tour rápido para você conhecer todas as funcionalidades.',
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="header"]',
      content: 'Este é o cabeçalho com o nome do seu operador logístico. Use o botão de sair quando quiser encerrar a sessão.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="status"]',
      content: 'Aqui você vê o status do seu operador e a pontuação de confiabilidade. Quanto maior a pontuação, melhor!',
      disableBeacon: true,
    },
    {
      target: '[data-tour="stats"]',
      content: 'Estas são suas estatísticas principais: promessas ativas, entregas do mês, total geral e peso total coletado.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="tabs"]',
      content: 'Use estas abas para alternar entre entregas previstas (promessas ativas) e entregas já realizadas.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="scan-action"]',
      content: 'Quando um usuário chegar para entregar materiais, clique aqui para escanear o QR Code dele e iniciar a coleta!',
      disableBeacon: true,
    },
  ];

  useEffect(() => {
    loadCooperativa();
    loadStats();
    loadEntregasPrevistas();
    loadEntregasEmColeta();
    loadEntregasRealizadas();
    
    // Atualizar a cada 30 segundos para garantir dados frescos
    const interval = setInterval(() => {
      loadStats();
      loadEntregasPrevistas();
      loadEntregasEmColeta();
      loadEntregasRealizadas();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, periodFilter, materialFilter]);

  const loadCooperativa = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('cooperativas')
      .select('*')
      .eq('id_user', user.id)
      .single();
    
    if (data) setCooperativa(data);
  };

  const loadStats = async () => {
    if (!user) return;

    const { data: coopData } = await supabase
      .from('cooperativas')
      .select('id, pontuacao_confiabilidade')
      .eq('id_user', user.id)
      .single();

    if (!coopData) return;

    const { data: entregas } = await supabase
      .from('entregas_reciclaveis')
      .select('*')
      .eq('id_cooperativa', coopData.id);

    const pendentes = entregas?.filter(e => e.status_promessa === 'ativa').length || 0;
    const emColeta = entregas?.filter(e => e.status_promessa === 'em_coleta').length || 0;
    const pesoTotal = entregas?.reduce((acc, e) => acc + (e.peso_validado || 0), 0) || 0;
    
    // Entregas do mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const entregasMes = entregas?.filter(e => 
      e.data_validacao && new Date(e.data_validacao) >= inicioMes
    ).length || 0;

    setStats({
      totalEntregas: entregas?.length || 0,
      entregasPendentes: pendentes,
      entregasEmColeta: emColeta,
      pesoTotal,
      pontuacao: coopData.pontuacao_confiabilidade,
      entregasMes
    });
  };

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([
        loadStats(),
        loadEntregasPrevistas(),
        loadEntregasEmColeta(),
        loadEntregasRealizadas()
      ]),
      {
        loading: 'Atualizando dados...',
        success: 'Dados atualizados!',
        error: 'Erro ao atualizar'
      }
    );
  };

  const loadEntregasPrevistas = async () => {
    if (!user) return;

    const { data: coopData } = await supabase
      .from('cooperativas')
      .select('id')
      .eq('id_user', user.id)
      .maybeSingle();

    if (!coopData) return;

    const { data } = await supabase
      .from('entregas_reciclaveis')
      .select('*')
      .eq('id_cooperativa', coopData.id)
      .eq('status_promessa', 'ativa')
      .order('data_geracao', { ascending: false });

    if (data) {
      setEntregasPrevistas(data);
    }
  };

  const loadEntregasEmColeta = async () => {
    if (!user) return;

    const { data: coopData } = await supabase
      .from('cooperativas')
      .select('id')
      .eq('id_user', user.id)
      .maybeSingle();

    if (!coopData) return;

    const { data } = await supabase
      .from('entregas_reciclaveis')
      .select('*')
      .eq('id_cooperativa', coopData.id)
      .eq('status_promessa', 'em_coleta')
      .order('data_recebimento', { ascending: false });

    if (data) {
      setEntregasEmColeta(data);
    }
  };

  const loadEntregasRealizadas = async () => {
    if (!user) return;

    const { data: coopData } = await supabase
      .from('cooperativas')
      .select('id')
      .eq('id_user', user.id)
      .single();

    if (!coopData) return;

    let query = supabase
      .from('entregas_reciclaveis')
      .select('*')
      .eq('id_cooperativa', coopData.id)
      .eq('status_promessa', 'finalizada');

    // Aplicar filtro de período
    if (periodFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (periodFilter === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (periodFilter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (periodFilter === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      query = query.gte('data_validacao', startDate.toISOString());
    }

    // Aplicar filtro de tipo de material
    if (materialFilter !== 'all') {
      query = query.eq('tipo_material', materialFilter);
    }

    const { data } = await query
      .order('data_validacao', { ascending: false })
      .limit(50);

    if (data) {
      setEntregasRealizadas(data);
    }
  };

  if (!cooperativa) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Cooperativa não encontrada</CardTitle>
            <CardDescription>
              Sua conta não está vinculada a nenhuma cooperativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <TourGuide
        steps={tourSteps}
        run={run}
        onComplete={completeTour}
        onSkip={completeTour}
      />

      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between" data-tour="header">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <Recycle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{cooperativa.nome_fantasia}</h1>
              <p className="text-sm text-muted-foreground">Painel do Operador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} title="Atualizar dados">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={startTour} title="Ver tour guiado">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <Card 
          data-tour="status"
          className={`border-2 ${
          cooperativa.status === 'aprovada' ? 'border-success bg-success/5' :
          cooperativa.status === 'pendente_aprovacao' ? 'border-warning bg-warning/5' :
          'border-destructive bg-destructive/5'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status do Operador</p>
                <Badge className={`mt-1 ${
                  cooperativa.status === 'aprovada' ? 'bg-success' :
                  cooperativa.status === 'pendente_aprovacao' ? 'bg-warning' :
                  'bg-destructive'
                }`}>
                  {cooperativa.status === 'aprovada' ? 'Aprovada' :
                   cooperativa.status === 'pendente_aprovacao' ? 'Pendente Aprovação' :
                   'Suspensa'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.pontuacao}</p>
                  <p className="text-xs text-muted-foreground">Confiabilidade</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4" data-tour="stats">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Promessas Ativas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-warning" />
                {stats.entregasPendentes}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Em Coleta</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                {stats.entregasEmColeta}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Entregas no Mês</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-success" />
                {stats.entregasMes}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Peso Total</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-success" />
                {formatWeight(stats.pesoTotal, 1)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Aba de Entregas */}
        <Tabs defaultValue="previstas" className="w-full" data-tour="tabs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="previstas">
              Previstas ({entregasPrevistas.length})
            </TabsTrigger>
            <TabsTrigger value="em_coleta">
              Em Coleta ({entregasEmColeta.length})
            </TabsTrigger>
            <TabsTrigger value="realizadas">
              Finalizadas ({entregasRealizadas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="previstas" className="space-y-4">
            {entregasPrevistas.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma entrega prevista no momento</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {entregasPrevistas.map((entrega) => (
                  <CooperativeDeliveryCard
                    key={entrega.id}
                    entrega={entrega}
                    onScanQR={() => navigate('/cooperative/scan-qrcode')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="em_coleta" className="space-y-4">
            {entregasEmColeta.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma entrega em processo de coleta</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Entregas escaneadas aguardando registro de materiais
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {entregasEmColeta.map((entrega) => (
                  <Card key={entrega.id} className="border-2 border-primary/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          <p className="font-medium">Entrega #{entrega.id.slice(0, 8)}</p>
                        </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Recebido: {new Date(entrega.data_recebimento).toLocaleString('pt-BR')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {entrega.tipo_material}
                            </Badge>
                          </div>
                          {entrega.peso_estimado && (
                            <p className="text-sm text-muted-foreground">
                              Peso estimado: {entrega.peso_estimado.toFixed(2)} kg
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => navigate(`/cooperative/register-materials/${entrega.id}`)}
                          size="lg"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Continuar Registro
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="realizadas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Período
                    </label>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as entregas</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mês</SelectItem>
                        <SelectItem value="year">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Tipo de Material
                    </label>
                    <Select value={materialFilter} onValueChange={setMaterialFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os materiais</SelectItem>
                        <SelectItem value="Plástico">Plástico</SelectItem>
                        <SelectItem value="Papel">Papel</SelectItem>
                        <SelectItem value="Vidro">Vidro</SelectItem>
                        <SelectItem value="Metal">Metal</SelectItem>
                        <SelectItem value="Alumínio">Alumínio</SelectItem>
                        <SelectItem value="Laminado">Laminado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {entregasRealizadas.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {periodFilter !== 'all' || materialFilter !== 'all' 
                        ? 'Nenhuma entrega encontrada com os filtros selecionados'
                        : 'Nenhuma entrega realizada'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardDescription>
                    {entregasRealizadas.length} {entregasRealizadas.length === 1 ? 'entrega encontrada' : 'entregas encontradas'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {entregasRealizadas.map((entrega) => (
                      <div key={entrega.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-medium">Entrega #{entrega.id.slice(0, 8)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{new Date(entrega.data_validacao).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {entrega.tipo_material}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-success">{entrega.peso_validado?.toFixed(2)} kg</p>
                          {entrega.peso_rejeito_kg > 0 && (
                            <p className="text-xs text-destructive">Rejeito: {entrega.peso_rejeito_kg?.toFixed(2)} kg</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Ação Principal */}
        <Card className="bg-primary text-primary-foreground" data-tour="scan-action">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pronto para coletar?</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Escaneie o QR Code do usuário para iniciar
                </CardDescription>
              </div>
              <QrCode className="h-12 w-12" />
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/cooperative/scan-qrcode')}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Escanear QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}