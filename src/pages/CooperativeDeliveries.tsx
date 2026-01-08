import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CooperativeDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveries();
  }, [user]);

  const loadDeliveries = async () => {
    if (!user) return;

    const { data: coopData } = await supabase
      .from('cooperativas')
      .select('id')
      .eq('id_user', user.id)
      .single();

    if (!coopData) return;

    const { data } = await supabase
      .from('entregas_reciclaveis')
      .select(`
        *,
        profiles:id_usuario (nome)
      `)
      .eq('id_cooperativa', coopData.id)
      .order('data_geracao', { ascending: false });

    if (data) setDeliveries(data);
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'gerada': <Badge variant="secondary">Aguardando</Badge>,
      'recebida': <Badge className="bg-warning">Recebida</Badge>,
      'validada': <Badge className="bg-success">Validada</Badge>,
      'fechada': <Badge>Fechada</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  const filterDeliveries = (status: string) => {
    if (status === 'all') return deliveries;
    return deliveries.filter(d => d.status === status);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cooperative')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Entregas Recebidas</h1>
            <p className="text-muted-foreground">Histórico de todas as entregas</p>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="gerada">Pendentes</TabsTrigger>
            <TabsTrigger value="recebida">Recebidas</TabsTrigger>
            <TabsTrigger value="validada">Validadas</TabsTrigger>
          </TabsList>

          {['all', 'gerada', 'recebida', 'validada'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterDeliveries(tab).map((delivery) => (
                <Card key={delivery.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Package className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{delivery.tipo_material}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Usuário: {delivery.profiles?.nome}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(delivery.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Peso Estimado</p>
                        <p className="font-medium">{delivery.peso_estimado || 'N/A'} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Peso Validado</p>
                        <p className="font-medium">{delivery.peso_validado || 'N/A'} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data Geração</p>
                        <p className="font-medium">
                          {new Date(delivery.data_geracao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Código QR</p>
                        <p className="font-mono text-xs">{delivery.qrcode_id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filterDeliveries(tab).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma entrega encontrada</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}