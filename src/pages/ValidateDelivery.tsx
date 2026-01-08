import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, CheckCircle, Loader2, Scale, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SocialShareButtons from '@/components/SocialShareButtons';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ValidateDelivery() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [qrcodeId, setQrcodeId] = useState('');
  const [delivery, setDelivery] = useState<any>(null);
  const [pesoValidado, setPesoValidado] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [validatedDelivery, setValidatedDelivery] = useState<any>(null);
  const [deliveryItems, setDeliveryItems] = useState<any[]>([]);
  const [variacaoInfo, setVariacaoInfo] = useState<{
    variacao_percentual: number;
    variacao_absoluta: number;
    dentro_margem: boolean;
    fator_pontuacao: number;
    pontos_base: number;
    pontos_finais: number;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const searchDelivery = async () => {
    if (!qrcodeId.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o código QR',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    try {
      const { data: coopData } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .single();

      if (!coopData) throw new Error('Cooperativa não encontrada');

      const { data, error } = await supabase
        .from('entregas_reciclaveis')
        .select(`
          *,
          profiles:id_usuario (nome, telefone)
        `)
        .eq('qrcode_id', qrcodeId)
        .eq('id_cooperativa', coopData.id)
        .single();

      if (error) throw new Error('Entrega não encontrada');

      // Verificar se o QR code expirou (24 horas)
      const dataGeracao = new Date(data.data_geracao);
      const dataLimite = new Date(dataGeracao);
      dataLimite.setHours(dataLimite.getHours() + 24);
      const agora = new Date();

      if (data.status === 'gerada' && agora > dataLimite) {
        // Marcar como expirado
        await supabase
          .from('entregas_reciclaveis')
          .update({ status: 'expirada' })
          .eq('id', data.id);

        throw new Error('Este QR code expirou após 24 horas. O usuário deve gerar um novo código.');
      }

      if (data.status === 'expirada') {
        throw new Error('Este QR code já expirou. O usuário deve gerar um novo código.');
      }

      // Carregar itens vinculados se existirem
      if (data.itens_vinculados && data.itens_vinculados.length > 0) {
        const { data: materiais, error: materiaisError } = await supabase
          .from('materiais_reciclaveis_usuario')
          .select('*')
          .in('id', data.itens_vinculados);

        if (!materiaisError && materiais) {
          setDeliveryItems(materiais);
        }
      }

      setDelivery(data);
      setPesoValidado(data.peso_estimado?.toString() || '');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setDelivery(null);
    } finally {
      setSearching(false);
    }
  };

  const validateDelivery = async () => {
    if (!pesoValidado || !delivery) {
      toast({
        title: 'Peso obrigatório',
        description: 'Informe o peso validado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const newStatus = delivery.status === 'gerada' ? 'recebida' : 'validada';
      const updateData: any = {
        peso_validado: parseFloat(pesoValidado),
        status: newStatus
      };

      if (newStatus === 'recebida') {
        updateData.data_recebimento = new Date().toISOString();
      } else if (newStatus === 'validada') {
        updateData.data_validacao = new Date().toISOString();
      }

      const { error } = await supabase
        .from('entregas_reciclaveis')
        .update(updateData)
        .eq('id', delivery.id);

      if (error) throw error;

      // Chamar edge function para processar entrega validada
      if (newStatus === 'validada') {
        const { error: processError } = await supabase.functions.invoke('processar-entrega-validada', {
          body: {
            entrega_id: delivery.id,
            peso_validado: parseFloat(pesoValidado)
          }
        });

        if (processError) {
          console.error('Erro ao processar entrega:', processError);
        }
      }

      toast({
        title: 'Entrega validada!',
        description: `Peso de ${pesoValidado}kg registrado com sucesso`,
      });

      // Guardar informações para compartilhamento se foi validada
      if (newStatus === 'validada') {
        setValidatedDelivery({
          tipo_material: delivery.tipo_material,
          peso_validado: parseFloat(pesoValidado)
        });
        setShowShareDialog(true);
      }

      // Reset
      setQrcodeId('');
      setDelivery(null);
      setPesoValidado('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularVariacaoPeso = async (pesoEstimado: number, pesoValidado: number) => {
    if (!pesoEstimado || !pesoValidado) {
      setVariacaoInfo(null);
      return;
    }

    try {
      // Buscar pontos por kg do material
      const { data: pontuacaoData } = await supabase
        .from('materiais_pontuacao')
        .select('pontos_por_6kg')
        .eq('tipo_material', delivery?.tipo_material || 'misto')
        .single();

      const pontosPor6kg = pontuacaoData?.pontos_por_6kg || 20;
      const pontosBase = Math.round((pesoValidado * pontosPor6kg) / 6);

      // Calcular variação percentual absoluta
      const variacaoPct = Math.abs((pesoValidado - pesoEstimado) / pesoEstimado) * 100;
      const variacaoAbs = Math.abs(pesoValidado - pesoEstimado);
      const dentroMargem = variacaoPct <= 10;

      let fatorPontuacao = 1.0;
      let pontosFinal = pontosBase;

      if (!dentroMargem) {
        // Variação > 10%: redução proporcional
        fatorPontuacao = Math.max(0, 1 - ((variacaoPct - 10) / 100));
        pontosFinal = Math.round(pontosBase * fatorPontuacao);
      }

      setVariacaoInfo({
        variacao_percentual: variacaoPct,
        variacao_absoluta: variacaoAbs,
        dentro_margem: dentroMargem,
        fator_pontuacao: fatorPontuacao,
        pontos_base: pontosBase,
        pontos_finais: pontosFinal
      });
    } catch (error) {
      console.error('Erro ao calcular variação:', error);
    }
  };

  useEffect(() => {
    if (delivery?.peso_estimado && pesoValidado) {
      calcularVariacaoPeso(delivery.peso_estimado, parseFloat(pesoValidado));
    } else {
      setVariacaoInfo(null);
    }
  }, [pesoValidado, delivery]);

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'gerada': <Badge variant="secondary">Aguardando Recebimento</Badge>,
      'recebida': <Badge className="bg-warning">Recebida</Badge>,
      'validada': <Badge className="bg-success">Validada</Badge>,
      'fechada': <Badge>Fechada</Badge>
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cooperative')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Validar Entrega</h1>
            <p className="text-muted-foreground">Busque pelo código QR e registre o peso</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Entrega</CardTitle>
            <CardDescription>
              Digite ou escaneie o código QR da entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="qrcode">Código QR</Label>
                <Input
                  id="qrcode"
                  placeholder="CICLIK-..."
                  value={qrcodeId}
                  onChange={(e) => setQrcodeId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchDelivery()}
                />
              </div>
            </div>
            <Button onClick={searchDelivery} disabled={searching} className="w-full">
              {searching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar Entrega
            </Button>
          </CardContent>
        </Card>

        {delivery && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes da Entrega</CardTitle>
                {getStatusBadge(delivery.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Usuário</p>
                  <p className="font-medium">{delivery.profiles?.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{delivery.profiles?.telefone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Material</p>
                  <p className="font-medium">{delivery.tipo_material}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peso Estimado</p>
                  <p className="font-medium">{delivery.peso_estimado || 'N/A'} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Geração</p>
                  <p className="font-medium">
                    {new Date(delivery.data_geracao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-mono text-xs">{delivery.qrcode_id}</p>
                </div>
              </div>

              {deliveryItems.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="font-medium text-sm">Materiais para Entrega ({deliveryItems.length}):</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {deliveryItems.map((item) => (
                      <div key={item.id} className="text-sm p-2 bg-muted rounded">
                        • {item.descricao} ({item.tipo_embalagem} - {item.percentual_reciclabilidade}% reciclável)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {delivery.status !== 'fechada' && (
                <>
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="peso">Peso Validado (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.001"
                      placeholder="Ex: 5.5"
                      value={pesoValidado}
                      onChange={(e) => setPesoValidado(e.target.value)}
                    />
                  </div>

                  {variacaoInfo && delivery.peso_estimado && (
                    <Card className={`border-2 ${
                      variacaoInfo.dentro_margem 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                    }`}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className={`h-5 w-5 ${
                              variacaoInfo.dentro_margem ? 'text-green-600' : 'text-amber-600'
                            }`} />
                            <span className="font-semibold">Análise de Variação</span>
                          </div>
                          <Badge className={
                            variacaoInfo.dentro_margem 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-amber-600 hover:bg-amber-700'
                          }>
                            {variacaoInfo.dentro_margem ? 'Conforme' : 'Fora da Margem'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Peso Estimado</p>
                            <p className="text-lg font-bold">{delivery.peso_estimado.toFixed(3)} kg</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Peso Validado</p>
                            <p className="text-lg font-bold">{parseFloat(pesoValidado).toFixed(3)} kg</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-2">
                            {variacaoInfo.variacao_percentual === 0 ? (
                              <Scale className="h-4 w-4 text-green-600" />
                            ) : parseFloat(pesoValidado) > delivery.peso_estimado ? (
                              <TrendingUp className="h-4 w-4 text-amber-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-sm font-medium">Variação:</span>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              variacaoInfo.dentro_margem ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {variacaoInfo.variacao_percentual.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({variacaoInfo.variacao_absoluta > 0 ? '+' : ''}{variacaoInfo.variacao_absoluta.toFixed(3)} kg)
                            </p>
                          </div>
                        </div>

                        <div className="border-t pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Pontos Base:</span>
                            <span className="font-medium">{variacaoInfo.pontos_base} pts</span>
                          </div>
                          {!variacaoInfo.dentro_margem && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Fator de Redução:</span>
                              <span className="font-medium text-amber-600">
                                {(variacaoInfo.fator_pontuacao * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                            <span>Pontos Finais:</span>
                            <span className={variacaoInfo.dentro_margem ? 'text-green-600' : 'text-amber-600'}>
                              {variacaoInfo.pontos_finais} pts
                            </span>
                          </div>
                        </div>

                        {!variacaoInfo.dentro_margem && (
                          <Alert className="border-amber-600">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-sm">
                              A variação de {variacaoInfo.variacao_percentual.toFixed(2)}% excede a margem de 10%. 
                              Os pontos foram reduzidos proporcionalmente.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Button onClick={validateDelivery} disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    Confirmar Validação
                    {variacaoInfo && ` (+${variacaoInfo.pontos_finais} pts)`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de compartilhamento após validação */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrega Validada com Sucesso! ♻️</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {validatedDelivery && (
              <>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-lg font-semibold">
                    {validatedDelivery.tipo_material}
                  </p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {validatedDelivery.peso_validado.toFixed(1)} kg
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    validados pela cooperativa
                  </p>
                </div>
                <SocialShareButtons
                  shareData={{
                    type: 'entrega_validada',
                    tipo_material: validatedDelivery.tipo_material,
                    peso_validado: validatedDelivery.peso_validado,
                  }}
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