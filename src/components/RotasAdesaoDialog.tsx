import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Route, Calendar, MapPin, QrCode, Loader2, Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface RotaDisponivel {
  id: string;
  nome: string;
  descricao: string | null;
  operador?: { nome_fantasia: string } | null;
  dias?: { dia_semana: number; horario_inicio: string | null; horario_fim: string | null }[];
  areas?: { bairro: string | null; cidade: string; uf: string }[];
}

interface MinhaAdesao {
  id: string;
  id_rota: string;
  qrcode_adesao: string;
  hash_qrcode: string;
  endereco_coleta: string;
  observacoes: string | null;
  status: string;
  data_adesao: string;
  rota?: { nome: string; operador?: { nome_fantasia: string } | null } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RotasAdesaoDialog({ open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rotasDisponiveis, setRotasDisponiveis] = useState<RotaDisponivel[]>([]);
  const [minhasAdesoes, setMinhasAdesoes] = useState<MinhaAdesao[]>([]);
  const [selectedRota, setSelectedRota] = useState<RotaDisponivel | null>(null);
  const [enderecoColeta, setEnderecoColeta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('disponiveis');

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRotasDisponiveis(), loadMinhasAdesoes()]);
    setLoading(false);
  };

  const loadRotasDisponiveis = async () => {
    try {
      // Buscar rotas ativas
      const { data: rotas, error } = await supabase
        .from('rotas_coleta')
        .select(`
          id,
          nome,
          descricao,
          operador:cooperativas(nome_fantasia)
        `)
        .eq('status', 'ativa')
        .order('nome');

      if (error) throw error;

      // Para cada rota, buscar dias e áreas
      const rotasComDetalhes = await Promise.all(
        (rotas || []).map(async (rota: any) => {
          const [diasRes, areasRes] = await Promise.all([
            supabase.from('rotas_dias_coleta').select('dia_semana, horario_inicio, horario_fim').eq('id_rota', rota.id),
            supabase.from('rotas_areas_cobertura').select('bairro, cidade, uf').eq('id_rota', rota.id)
          ]);

          return {
            ...rota,
            operador: Array.isArray(rota.operador) ? rota.operador[0] : rota.operador,
            dias: diasRes.data || [],
            areas: areasRes.data || []
          } as RotaDisponivel;
        })
      );

      // Filtrar rotas onde o usuário já tem adesão ativa ou pausada (permite readerir se cancelada)
      const { data: minhasAdesoesAtivas } = await supabase
        .from('usuarios_rotas')
        .select('id_rota')
        .eq('id_usuario', user?.id)
        .in('status', ['ativa', 'pausada']);

      const idsAderidos = new Set((minhasAdesoesAtivas || []).map(a => a.id_rota));
      const rotasFiltradas = rotasComDetalhes.filter(r => !idsAderidos.has(r.id));

      setRotasDisponiveis(rotasFiltradas);
    } catch (error: any) {
      toast.error('Erro ao carregar rotas', { description: error.message });
    }
  };

  const loadMinhasAdesoes = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_rotas')
        .select(`
          *,
          rota:rotas_coleta(
            nome,
            operador:cooperativas(nome_fantasia)
          )
        `)
        .eq('id_usuario', user?.id)
        .order('data_adesao', { ascending: false });

      if (error) throw error;
      setMinhasAdesoes(data || []);

      if ((data || []).length > 0) {
        setActiveTab('minhas');
      }
    } catch (error: any) {
      toast.error('Erro ao carregar adesões', { description: error.message });
    }
  };

  const handleSelectRota = (rota: RotaDisponivel) => {
    setSelectedRota(rota);
    // Preencher endereço do perfil se disponível
    if (profile) {
      const endereco = [
        profile.logradouro,
        profile.numero,
        profile.complemento,
        profile.bairro,
        profile.cidade,
        profile.uf,
        profile.cep
      ].filter(Boolean).join(', ');
      setEnderecoColeta(endereco);
    }
  };

  const handleAderir = async () => {
    if (!selectedRota || !user) return;
    
    if (!enderecoColeta.trim()) {
      toast.error('Informe o endereço de coleta');
      return;
    }

    setSaving(true);
    try {
      // Verificar se já existe uma adesão cancelada para reativar
      const { data: existingAdesao } = await supabase
        .from('usuarios_rotas')
        .select('*')
        .eq('id_usuario', user.id)
        .eq('id_rota', selectedRota.id)
        .eq('status', 'cancelada')
        .single();

      let qrcodeAdesao: string;
      let hashQrcode: string;

      if (existingAdesao) {
        // Reativar adesão existente
        qrcodeAdesao = existingAdesao.qrcode_adesao;
        hashQrcode = existingAdesao.hash_qrcode;

        const { error } = await supabase
          .from('usuarios_rotas')
          .update({
            status: 'ativa',
            endereco_coleta: enderecoColeta,
            observacoes: observacoes || null,
            data_adesao: new Date().toISOString()
          })
          .eq('id', existingAdesao.id);

        if (error) throw error;
      } else {
        // Gerar QR Code único para nova adesão
        const { data: qrcodeData, error: qrcodeError } = await supabase
          .rpc('gerar_qrcode_adesao_rota');

        if (qrcodeError) throw qrcodeError;

        qrcodeAdesao = qrcodeData;
        hashQrcode = crypto.randomUUID();

        // Criar nova adesão
        const { error } = await supabase
          .from('usuarios_rotas')
          .insert({
            id_usuario: user.id,
            id_rota: selectedRota.id,
            qrcode_adesao: qrcodeAdesao,
            hash_qrcode: hashQrcode,
            endereco_coleta: enderecoColeta,
            observacoes: observacoes || null,
            status: 'ativa'
          });

        if (error) throw error;
      }

      // Gerar imagem do QR Code
      const qrData = JSON.stringify({
        tipo: 'adesao_rota_ciclik',
        qrcode: qrcodeAdesao,
        hash: hashQrcode,
        id_rota: selectedRota.id
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#10B981',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
      toast.success(existingAdesao ? 'Adesão reativada com sucesso!' : 'Adesão realizada com sucesso!');
      
      // Recarregar dados
      loadData();
      setSelectedRota(null);
      setEnderecoColeta('');
      setObservacoes('');
      setActiveTab('minhas');
    } catch (error: any) {
      toast.error('Erro ao aderir à rota', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarAdesao = async (adesaoId: string) => {
    if (!confirm('Deseja realmente cancelar esta adesão?')) return;

    try {
      const { error } = await supabase
        .from('usuarios_rotas')
        .update({ status: 'cancelada' })
        .eq('id', adesaoId);

      if (error) throw error;
      toast.success('Adesão cancelada');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao cancelar', { description: error.message });
    }
  };

  const handleDownloadQR = async (adesao: MinhaAdesao) => {
    try {
      const qrData = JSON.stringify({
        tipo: 'adesao_rota_ciclik',
        qrcode: adesao.qrcode_adesao,
        hash: adesao.hash_qrcode,
        id_rota: adesao.id_rota
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#10B981',
          light: '#FFFFFF'
        }
      });

      const link = document.createElement('a');
      link.download = `qrcode-rota-${adesao.qrcode_adesao}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
    }
  };

  const closeAndReset = () => {
    setSelectedRota(null);
    setQrCodeUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Rotas de Coleta Semanal
          </DialogTitle>
          <DialogDescription>
            Adira a uma rota para receber coletas semanais com QR Code fixo
          </DialogDescription>
        </DialogHeader>

        {qrCodeUrl ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-block bg-white p-4 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="mt-4 text-lg font-medium text-success">
                ✓ Adesão realizada com sucesso!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Este é seu QR Code fixo. Imprima e deixe visível para o coletor.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => {
                const link = document.createElement('a');
                link.download = 'qrcode-rota.png';
                link.href = qrCodeUrl;
                link.click();
              }}>
                <Download className="mr-2 h-4 w-4" />
                Baixar QR Code
              </Button>
              <Button onClick={() => setQrCodeUrl(null)}>
                Continuar
              </Button>
            </div>
          </div>
        ) : selectedRota ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedRota.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRota.operador?.nome_fantasia || 'Operador não definido'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRota(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {selectedRota.dias && selectedRota.dias.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {selectedRota.dias.map((dia, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {DIAS_SEMANA[dia.dia_semana]}
                        {dia.horario_inicio && ` ${dia.horario_inicio.slice(0, 5)}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço de Coleta *</Label>
              <Textarea
                id="endereco"
                value={enderecoColeta}
                onChange={e => setEnderecoColeta(e.target.value)}
                placeholder="Endereço completo onde os materiais serão coletados"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observações (opcional)</Label>
              <Input
                id="obs"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex: Portão azul, tocar a campainha"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRota(null)}>
                Voltar
              </Button>
              <Button onClick={handleAderir} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Adesão
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="disponiveis" className="flex-1">
                Rotas Disponíveis
              </TabsTrigger>
              <TabsTrigger value="minhas" className="flex-1">
                Minhas Rotas ({minhasAdesoes.filter(a => a.status === 'ativa').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="disponiveis" className="space-y-3 mt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rotasDisponiveis.length === 0 ? (
                <div className="text-center py-8">
                  <Route className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {minhasAdesoes.length > 0 
                      ? 'Você já aderiu a todas as rotas disponíveis' 
                      : 'Nenhuma rota disponível na sua região'}
                  </p>
                </div>
              ) : (
                rotasDisponiveis.map(rota => (
                  <Card 
                    key={rota.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectRota(rota)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{rota.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            {rota.operador?.nome_fantasia || 'Operador não definido'}
                          </p>
                          {rota.descricao && (
                            <p className="text-sm mt-1">{rota.descricao}</p>
                          )}
                        </div>
                        <Button size="sm">
                          Aderir
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {rota.dias && rota.dias.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {rota.dias.map((dia, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {DIAS_SEMANA[dia.dia_semana]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {rota.areas && rota.areas.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {(() => {
                                const uf = rota.areas[0]?.uf;
                                const cidade = rota.areas[0]?.cidade;
                                const bairros = [...new Set(rota.areas.map(a => a.bairro).filter(Boolean))];
                                const parts = [];
                                if (bairros.length > 0) parts.push(bairros.slice(0, 2).join(', ') + (bairros.length > 2 ? ` +${bairros.length - 2}` : ''));
                                if (cidade) parts.push(cidade);
                                if (uf) parts.push(uf);
                                return parts.join(' - ');
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="minhas" className="space-y-3 mt-4">
              {minhasAdesoes.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Você ainda não aderiu a nenhuma rota
                  </p>
                </div>
              ) : (
                minhasAdesoes.map(adesao => (
                  <Card key={adesao.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{adesao.rota?.nome}</h3>
                            {adesao.status === 'ativa' ? (
                              <Badge className="bg-success/20 text-success">Ativa</Badge>
                            ) : adesao.status === 'pausada' ? (
                              <Badge variant="secondary">Pausada</Badge>
                            ) : (
                              <Badge variant="destructive">Cancelada</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {adesao.rota?.operador?.nome_fantasia}
                          </p>
                        </div>
                        {adesao.status === 'ativa' && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadQR(adesao)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelarAdesao(adesao.id)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{adesao.endereco_coleta}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {adesao.qrcode_adesao}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
