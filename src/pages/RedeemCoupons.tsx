import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserPoints } from '@/hooks/useUserPoints';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, Gift, Coins, Plus, Trash2, Copy, AlertTriangle, Target, ChevronRight, Ticket, TicketPercent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import SocialShareButtons from '@/components/SocialShareButtons';
import CouponGallery from '@/components/CouponGallery';
interface Cupom {
  id: string;
  codigo: string;
  marketplace: string;
  valor_reais: number;
  pontos_necessarios: number;
  minimo_compra: number;
  quantidade_total: number;
  quantidade_disponivel: number;
  quantidade_resgatada: number;
  data_validade: string | null;
  ativo: boolean;
  limite_alerta: number;
}

interface CupomResgate {
  id: string;
  codigo_unico: string;
  pontos_utilizados: number;
  data_resgate: string;
  status: string;
  cupons: {
    marketplace: string;
    valor_reais: number;
    pontos_necessarios: number;
    data_validade: string | null;
  };
}

export default function RedeemCoupons() {
  const navigate = useNavigate();
  const { user, userRole, profile, refreshProfile } = useAuth();
  const { pontos: pontosCalculados, refetch: refetchPontos } = useUserPoints();
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Cupom[]>([]);
  const [meusCupons, setMeusCupons] = useState<CupomResgate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastRedeemedCoupon, setLastRedeemedCoupon] = useState<any>(null);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    marketplace: '',
    codigo: '',
    valor_reais: '',
    pontos_necessarios: '',
    minimo_compra: '',
    quantidade_total: '',
    data_validade: '',
    limite_alerta: '10'
  });

  useEffect(() => {
    if (!user) return;
    
    loadCupons();
    loadMeusCupons();
    
    // ✅ CORRIGIDO: Capturar a função de cleanup e executá-la no return
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, [user?.id]); // ✅ Usar user.id ao invés de user inteiro

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('cupons-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cupons'
      }, () => {
        loadCupons();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadCupons = async () => {
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('ativo', true)
      .eq('status', 'disponivel')
      .gt('quantidade_disponivel', 0)
      .or('data_validade.is.null,data_validade.gte.' + new Date().toISOString().split('T')[0])
      .order('valor_reais', { ascending: true });

    if (error) {
      console.error('Erro ao carregar cupons:', error);
      toast({
        title: 'Erro ao carregar cupons',
        description: error.message,
        variant: 'destructive'
      });
    }

    setCuponsDisponiveis(data || []);
    setLoading(false);
  };

  const loadMeusCupons = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cupons_resgates')
      .select(`
        *,
        cupons:id_cupom (marketplace, valor_reais, pontos_necessarios, data_validade)
      `)
      .eq('id_usuario', user.id)
      .order('data_resgate', { ascending: false });

    if (error) {
      console.error('Erro ao carregar meus cupons:', error);
      toast({
        title: 'Erro ao carregar cupons resgatados',
        description: error.message,
        variant: 'destructive'
      });
    }

    setMeusCupons(data || []);
  };


  const handleResgatar = async (cupomId: string) => {
    if (!user) return;

    const { data, error } = await supabase.rpc('resgatar_cupom', {
      p_cupom_id: cupomId,
      p_usuario_id: user.id
    });

    if (error || !data?.success) {
      toast({
        title: 'Erro ao resgatar',
        description: data?.error || error?.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Cupom resgatado! 🎉',
      description: `Seu código: ${data.codigo_unico}. Cupom de R$ ${data.valor_reais.toFixed(2)} resgatado por ${data.pontos_utilizados} pontos! Pontos restantes: ${data.pontos_restantes}`,
      duration: 8000
    });

    // Guardar informações do cupom resgatado para compartilhamento
    setLastRedeemedCoupon({
      valor_reais: data.valor_reais,
      codigo_unico: data.codigo_unico
    });
    setShowShareDialog(true);

    await refreshProfile();
    await refetchPontos();
    await loadCupons();
    await loadMeusCupons();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('cupons')
      .insert({
        marketplace: newCoupon.marketplace,
        codigo: newCoupon.codigo,
        valor_reais: parseFloat(newCoupon.valor_reais),
        pontos_necessarios: parseInt(newCoupon.pontos_necessarios),
        minimo_compra: parseFloat(newCoupon.minimo_compra),
        quantidade_total: parseInt(newCoupon.quantidade_total),
        quantidade_disponivel: parseInt(newCoupon.quantidade_total),
        quantidade_resgatada: 0,
        data_validade: newCoupon.data_validade || null,
        limite_alerta: parseInt(newCoupon.limite_alerta),
        ativo: true,
        status: 'disponivel'
      });

    if (error) {
      toast({
        title: 'Erro ao criar cupom',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Cupom criado com sucesso!'
    });

    setIsDialogOpen(false);
    setNewCoupon({
      marketplace: '',
      codigo: '',
      valor_reais: '',
      pontos_necessarios: '',
      minimo_compra: '',
      quantidade_total: '',
      data_validade: '',
      limite_alerta: '10'
    });
    loadCupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    const { error } = await supabase
      .from('cupons')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao desativar cupom',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Cupom desativado'
    });
    loadCupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Código copiado!',
      description: 'Cole este código no marketplace ao finalizar sua compra.'
    });
  };

  const marcarComoUsado = async (resgateId: string) => {
    const { error } = await supabase
      .from('cupons_resgates')
      .update({ 
        status: 'usado',
        data_uso: new Date().toISOString()
      })
      .eq('id', resgateId);

    if (error) {
      toast({
        title: 'Erro ao marcar como usado',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Cupom marcado como usado'
    });
    loadMeusCupons();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      resgatado: 'default',
      usado: 'secondary',
      expirado: 'destructive'
    };
    
    const labels: Record<string, string> = {
      resgatado: 'Resgatado',
      usado: 'Usado',
      expirado: 'Expirado'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Resgatar Cupons</h1>
            <p className="text-muted-foreground">Use seus pontos para resgatar cupons de desconto</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-emerald-500/10 border-primary/20">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-primary blur-3xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-emerald-500 blur-2xl" />
            </div>
            
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Sua Pontuação</p>
                  <motion.p 
                    className="text-4xl font-bold text-primary"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {pontosCalculados} pontos
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete missões e entregue recicláveis para ganhar mais pontos!
                  </p>
                </div>
                
                {/* Animated coupon icon */}
                <motion.div 
                  className="relative"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <TicketPercent className="h-10 w-10 text-primary relative z-10" />
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 divide-x divide-border">
                <motion.div 
                  className="flex flex-col items-center px-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold">{cuponsDisponiveis.length}</span>
                  <span className="text-xs text-muted-foreground text-center">Disponíveis</span>
                </motion.div>
                <motion.div 
                  className="flex flex-col items-center px-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 mb-2">
                    <TicketPercent className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold">{profile?.cupons_resgatados || 0}</span>
                  <span className="text-xs text-muted-foreground text-center">Resgatados</span>
                </motion.div>
                <motion.div 
                  className="flex flex-col items-center px-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 mb-2">
                    <Ticket className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold">{meusCupons.filter(c => c.status === 'usado').length}</span>
                  <span className="text-xs text-muted-foreground text-center">Usados</span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="disponiveis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disponiveis">Cupons Disponíveis</TabsTrigger>
            <TabsTrigger value="meus">Meus Cupons</TabsTrigger>
          </TabsList>

          <TabsContent value="disponiveis" className="space-y-4">
            {userRole === 'admin' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Lote de Cupons
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Novo Lote de Gift Cards</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Marketplace</Label>
                        <Input
                          placeholder="Ex: iFood"
                          value={newCoupon.marketplace}
                          onChange={(e) => setNewCoupon({ ...newCoupon, marketplace: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Código Base</Label>
                        <Input
                          placeholder="Ex: IFOOD20"
                          value={newCoupon.codigo}
                          onChange={(e) => setNewCoupon({ ...newCoupon, codigo: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Valor em R$</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="20.00"
                          value={newCoupon.valor_reais}
                          onChange={(e) => setNewCoupon({ ...newCoupon, valor_reais: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Pontos Necessários</Label>
                        <Input
                          type="number"
                          placeholder="600"
                          value={newCoupon.pontos_necessarios}
                          onChange={(e) => setNewCoupon({ ...newCoupon, pontos_necessarios: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">300pts=R$10, 600pts=R$20</p>
                      </div>
                      <div>
                        <Label>Compra Mínima (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newCoupon.minimo_compra}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minimo_compra: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade Total</Label>
                        <Input
                          type="number"
                          value={newCoupon.quantidade_total}
                          onChange={(e) => setNewCoupon({ ...newCoupon, quantidade_total: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Limite de Alerta</Label>
                        <Input
                          type="number"
                          value={newCoupon.limite_alerta}
                          onChange={(e) => setNewCoupon({ ...newCoupon, limite_alerta: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Data de Validade</Label>
                      <Input
                        type="date"
                        value={newCoupon.data_validade}
                        onChange={(e) => setNewCoupon({ ...newCoupon, data_validade: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">Criar Lote</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <Card className="p-6">
              <CouponGallery 
                cupons={cuponsDisponiveis}
                pontosUsuario={pontosCalculados}
                onResgatar={handleResgatar}
                isAdmin={userRole === 'admin'}
                onDelete={handleDeleteCoupon}
              />
            </Card>
          </TabsContent>

          <TabsContent value="meus" className="space-y-4">
            {meusCupons.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Você ainda não resgatou nenhum cupom</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Acumule pontos e resgate cupons de desconto!</p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <motion.button
                      onClick={() => navigate('/goals')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative px-6 py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 
                        text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-shadow
                        flex items-center gap-2 overflow-hidden"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                        -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                      >
                        <Target className="h-5 w-5" />
                      </motion.div>
                      <span>Atingir metas e ganhar pontos</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </motion.div>
                    </motion.button>
                  </motion.div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meusCupons.map((resgate) => (
                  <Card key={resgate.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{resgate.cupons.marketplace}</CardTitle>
                          <CardDescription>R$ {resgate.cupons.valor_reais.toFixed(2)} por {resgate.pontos_utilizados} pontos</CardDescription>
                        </div>
                        {getStatusBadge(resgate.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Código:</p>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono">{resgate.codigo_unico}</code>
                          <Button size="icon" variant="ghost" onClick={() => copyCode(resgate.codigo_unico)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {resgate.status === 'resgatado' && (
                        <Button variant="outline" onClick={() => marcarComoUsado(resgate.id)} className="w-full">
                          Marcar como Usado
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de compartilhamento após resgate */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cupom Resgatado com Sucesso! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lastRedeemedCoupon && (
              <>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">
                    R$ {lastRedeemedCoupon.valor_reais?.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Código: {lastRedeemedCoupon.codigo_unico}
                  </p>
                </div>
                <SocialShareButtons
                  shareData={{
                    type: 'cupom_resgatado',
                    valor_cupom: lastRedeemedCoupon.valor_reais,
                  }}
                  nomeUsuario={profile?.nome.split(' ')[0]}
                />
              </>
            )}
            <Button onClick={() => setShowShareDialog(false)} className="w-full" variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
