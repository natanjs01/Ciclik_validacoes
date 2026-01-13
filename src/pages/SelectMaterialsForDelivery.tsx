import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Package, Recycle, Plus, Scale, Route, QrCode, MapPin, ChevronDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RotasAdesaoDialog from "@/components/RotasAdesaoDialog";
import MaterialMultiSelect from "@/components/MaterialMultiSelect";
import CooperativeMap from "@/components/CooperativeMap";
import CooperativeSelectorSheet from "@/components/CooperativeSelectorSheet";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance } from "@/lib/distance";

interface Material {
  id: string;
  descricao: string;
  tipo_embalagem: string;
  percentual_reciclabilidade: number;
  data_cadastro: string;
  origem_cadastro: string;
  pontos_ganhos: number;
  quantidade: number | null;
  peso_unitario_gramas: number | null;
  peso_total_estimado_gramas: number | null;
}

interface Cooperativa {
  id: string;
  nome_fantasia: string;
  cidade: string | null;
  uf: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
}

const SelectMaterialsForDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coordinates } = useGeolocation();
  
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [selectedCooperativa, setSelectedCooperativa] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshingCoops, setRefreshingCoops] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [deliveryId, setDeliveryId] = useState<string>("");
  const [showDiverseDialog, setShowDiverseDialog] = useState(false);
  const [diverseDescription, setDiverseDescription] = useState("");
  const [diverseWeight, setDiverseWeight] = useState("");
  const [addingDiverse, setAddingDiverse] = useState(false);
  const [showRotasDialog, setShowRotasDialog] = useState(false);

  // Calculate distances and sort cooperatives
  const cooperativasComDistancia = useMemo(() => {
    if (!coordinates) return cooperativas;
    
    return cooperativas
      .map((coop) => ({
        ...coop,
        distance: coop.latitude && coop.longitude
          ? calculateDistance(
              coordinates.latitude,
              coordinates.longitude,
              coop.latitude,
              coop.longitude
            )
          : null,
      }))
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [cooperativas, coordinates]);

  const selectedCooperativaData = useMemo(
    () => cooperativasComDistancia.find((c) => c.id === selectedCooperativa),
    [cooperativasComDistancia, selectedCooperativa]
  );

  useEffect(() => {
    if (user) {
      verificarExpiracoesECarregar();
      
      // 🔄 Subscrição em tempo real para cooperativas
      const cooperativasSubscription = supabase
        .channel('cooperativas-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cooperativas'
          },
          (payload) => {
            console.log('🔄 Cooperativa atualizada em tempo real:', payload);
            console.log('🔄 Tipo de evento:', payload.eventType);
            console.log('🔄 Dados novos:', payload.new);
            
            // Força reload com pequeno delay para garantir que o DB foi atualizado
            setTimeout(() => {
              console.log('🔄 Recarregando cooperativas após atualização...');
              loadCooperativas();
            }, 1000);
          }
        )
        .subscribe();

      return () => {
        cooperativasSubscription.unsubscribe();
      };
    }
  }, [user]);

  const verificarExpiracoesECarregar = async () => {
    try {
      await supabase.functions.invoke('validar-expiracoes-entregas');
    } catch (error) {
      // Ignorar erro de validação
    }
    loadMateriais();
    loadCooperativas();
  };

  const loadMateriais = async () => {
    try {
      const { data, error } = await supabase
        .from('materiais_reciclaveis_usuario')
        .select('*')
        .eq('id_usuario', user?.id)
        .eq('status', 'disponivel')
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      setMateriais(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar materiais', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadCooperativas = async () => {
    try {
      console.log('🔍 Carregando cooperativas do banco...');
      
      const { data, error } = await supabase
        .from('cooperativas')
        .select('id, nome_fantasia, cidade, uf, logradouro, bairro, latitude, longitude')
        .eq('status', 'aprovada')
        .order('nome_fantasia');

      if (error) throw error;
      
      console.log('🗺️ Cooperativas carregadas:', data?.length, 'cooperativas');
      
      // Log detalhado das coordenadas
      data?.forEach(coop => {
        if (coop.latitude && coop.longitude) {
          console.log(`📍 ${coop.nome_fantasia}: [${coop.latitude}, ${coop.longitude}]`);
        } else {
          console.log(`⚠️ ${coop.nome_fantasia}: SEM COORDENADAS`);
        }
      });
      
      setCooperativas(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar cooperativas:', error);
      toast.error('Erro ao carregar cooperativas', { description: error.message });
    }
  };

  const refreshCooperativas = async () => {
    setRefreshingCoops(true);
    try {
      await loadCooperativas();
      toast.success('Mapa atualizado!', {
        description: 'Localizações das cooperativas foram recarregadas'
      });
    } catch (error) {
      toast.error('Erro ao atualizar mapa');
    } finally {
      setRefreshingCoops(false);
    }
  };

  const toggleMaterial = (materialId: string) => {
    const newSelected = new Set(selectedMaterials);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterials(newSelected);
  };

  const deleteMaterial = async (materialId: string) => {
    try {
      const { data, error } = await supabase
        .from('materiais_reciclaveis_usuario')
        .delete()
        .eq('id', materialId)
        .eq('id_usuario', user?.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        const { error: retryError } = await supabase
          .from('materiais_reciclaveis_usuario')
          .delete()
          .eq('id', materialId);
        
        if (retryError) throw retryError;
      }

      setMateriais(prev => prev.filter(m => m.id !== materialId));
      setSelectedMaterials(prev => {
        const newSet = new Set(prev);
        newSet.delete(materialId);
        return newSet;
      });
      
      toast.success('Material excluído');
    } catch (error: any) {
      console.error('Erro ao excluir material:', error);
      toast.error('Erro ao excluir', { description: error.message });
      loadMateriais();
    }
  };

  const calcularPesoMaterialEmGramas = (material: Material): number => {
    const quantidade = material.quantidade ?? 1;
    const pesoUnitario = material.peso_unitario_gramas ?? 0;
    return material.peso_total_estimado_gramas ?? (quantidade * pesoUnitario);
  };

  const calcularPesoTotalEstimado = (): number => {
    const totalEmGramas = materiais
      .filter((m) => selectedMaterials.has(m.id))
      .reduce((total, m) => total + calcularPesoMaterialEmGramas(m), 0);
    return totalEmGramas / 1000;
  };

  const generateQRCode = async () => {
    if (selectedMaterials.size === 0) {
      toast.error('Selecione pelo menos um material');
      return;
    }

    if (!selectedCooperativa) {
      toast.error('Selecione uma cooperativa');
      return;
    }

    setGenerating(true);

    try {
      const qrcodeId = crypto.randomUUID();
      const entregaId = crypto.randomUUID();
      const hashQRCode = `${user?.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const itensVinculados = Array.from(selectedMaterials);
      const pesoEstimadoKg = calcularPesoTotalEstimado();

      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .insert({
          id: entregaId,
          id_usuario: user?.id,
          id_cooperativa: selectedCooperativa,
          qrcode_id: qrcodeId,
          hash_qrcode: hashQRCode,
          tipo_material: 'misto',
          status: 'gerada',
          status_promessa: 'ativa',
          itens_vinculados: itensVinculados,
          peso_estimado: pesoEstimadoKg,
          data_geracao: new Date().toISOString()
        })
        .select()
        .single();

      if (entregaError) throw entregaError;

      const { error: updateError } = await supabase
        .from('materiais_reciclaveis_usuario')
        .update({ status: 'em_entrega', id_entrega: entrega.id })
        .in('id', itensVinculados);

      if (updateError) throw updateError;

      const qrCodeData = JSON.stringify({
        tipo: 'promessa_entrega_ciclik',
        id_entrega: entrega.id,
        hash: hashQRCode,
        id_cooperativa: selectedCooperativa,
        peso_estimado: pesoEstimadoKg.toFixed(3),
        validade: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 400,
        margin: 2,
        color: { dark: '#10B981', light: '#FFFFFF' }
      });

      setQrCodeUrl(qrCodeDataUrl);
      setDeliveryId(entrega.id);

      toast.success('QR Code gerado com sucesso!', {
        description: `${selectedMaterials.size} materiais prontos para entrega`
      });
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code', { description: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.download = `qrcode-entrega-${deliveryId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleNewDelivery = () => {
    setQrCodeUrl("");
    setDeliveryId("");
    setSelectedMaterials(new Set());
    setSelectedCooperativa("");
    loadMateriais();
  };

  const handleAddDiverseEntry = async () => {
    if (!diverseDescription.trim()) {
      toast.error("Informe uma descrição para o material");
      return;
    }

    setAddingDiverse(true);
    try {
      const { data, error } = await supabase
        .from('materiais_reciclaveis_usuario')
        .insert({
          id_usuario: user?.id,
          descricao: diverseDescription.trim(),
          origem_cadastro: 'manual',
          tipo_embalagem: 'misto',
          percentual_reciclabilidade: 100,
          quantidade: 1,
          peso_unitario_gramas: diverseWeight ? parseFloat(diverseWeight.replace(',', '.')) * 1000 : null,
          peso_total_estimado_gramas: diverseWeight ? parseFloat(diverseWeight.replace(',', '.')) * 1000 : null,
          status: 'disponivel',
          pontos_ganhos: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Entrada diversa adicionada!', {
        description: 'O peso será definido pelo operador na coleta'
      });

      setMateriais(prev => [data, ...prev]);
      setSelectedMaterials(prev => new Set([...prev, data.id]));
      setDiverseDescription("");
      setDiverseWeight("");
      setShowDiverseDialog(false);
    } catch (error: any) {
      toast.error('Erro ao adicionar entrada', { description: error.message });
    } finally {
      setAddingDiverse(false);
    }
  };

  const canGenerate = selectedMaterials.size > 0 && selectedCooperativa;

  // QR Code Success Screen
  if (qrCodeUrl) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-success/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Recycle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Promessa Criada!</h2>
                  <p className="text-sm text-muted-foreground">
                    Apresente o QR Code na cooperativa
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[280px] mx-auto" />
              </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ID da Promessa</p>
                <p className="font-mono text-sm truncate">{deliveryId}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{selectedMaterials.size}</p>
                  <p className="text-xs text-muted-foreground">materiais</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">
                    {formatNumber(calcularPesoTotalEstimado(), 2)}
                  </p>
                  <p className="text-xs text-muted-foreground">kg estimados</p>
                </div>
              </div>

              <div className="bg-warning/10 p-3 rounded-lg flex items-center gap-2">
                <span className="text-lg">⏰</span>
                <p className="text-sm text-warning-foreground">
                  Este QR Code expira em <strong>24 horas</strong>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleDownloadQR} variant="outline">
                    Baixar QR
                  </Button>
                  <Button onClick={handleNewDelivery} variant="secondary">
                    Nova Entrega
                  </Button>
                </div>
                
                <Button
                  onClick={() => navigate('/user')}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ver Minhas Entregas
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main Selection Screen
  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b"
      >
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/user')}
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display font-semibold text-lg">Entregar Materiais</h1>
                <p className="text-xs text-muted-foreground">
                  Selecione e escolha o ponto de entrega
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowDiverseDialog(true)}
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground animate-pulse mb-3" />
              <p className="text-muted-foreground">Carregando materiais...</p>
            </div>
          </div>
        ) : materiais.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Nenhum material disponível</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Cadastre notas fiscais ou adicione entradas diversas para começar
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate('/upload-receipt')} variant="outline">
                Cadastrar Nota Fiscal
              </Button>
              <Button onClick={() => setShowDiverseDialog(true)} variant="accent">
                <Plus className="mr-2 h-4 w-4" />
                Entradas Diversas
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Materials Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">Seus Materiais</h2>
                {selectedMaterials.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedMaterials.size} selecionado{selectedMaterials.size > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <MaterialMultiSelect
                materials={materiais.map((m) => ({
                  id: m.id,
                  descricao: m.descricao,
                  tipo_embalagem: m.tipo_embalagem,
                  peso_gramas: calcularPesoMaterialEmGramas(m),
                  origem_cadastro: m.origem_cadastro,
                }))}
                selectedIds={selectedMaterials}
                onToggle={toggleMaterial}
                onDelete={deleteMaterial}
                onSelectAll={() => setSelectedMaterials(new Set(materiais.map((m) => m.id)))}
                onClearAll={() => setSelectedMaterials(new Set())}
              />
            </motion.section>

            {/* Map Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="font-medium text-sm">Localização</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshCooperativas}
                  disabled={refreshingCoops}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", refreshingCoops && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
              <CooperativeMap
                cooperativas={cooperativasComDistancia}
                selectedId={selectedCooperativa}
                onSelect={setSelectedCooperativa}
                userLocation={coordinates}
                className="h-[200px]"
              />
            </motion.section>

            {/* Cooperative Selector Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">Ponto de Entrega</h2>
                <span className="text-xs text-muted-foreground">
                  ({cooperativasComDistancia.length} disponíveis)
                </span>
              </div>
              <CooperativeSelectorSheet
                cooperativas={cooperativasComDistancia}
                selected={selectedCooperativa}
                onSelect={setSelectedCooperativa}
              />
            </motion.section>
          </>
        )}
      </div>

      {/* Sticky Footer */}
      {materiais.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-30"
        >
          <div className="container mx-auto px-4 py-4 max-w-2xl">
            {/* Summary Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  selectedMaterials.size > 0 ? "bg-primary/20" : "bg-muted"
                )}>
                  <Package className={cn(
                    "h-4 w-4",
                    selectedMaterials.size > 0 ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className="text-sm font-medium">
                  {selectedMaterials.size} {selectedMaterials.size === 1 ? 'material' : 'materiais'}
                </span>
                {selectedMaterials.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    • {formatNumber(calcularPesoTotalEstimado(), 2)} kg
                  </span>
                )}
              </div>
              
              {!selectedCooperativa && selectedMaterials.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  Toque no mapa para selecionar
                </span>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateQRCode}
              disabled={generating || !canGenerate}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {generating ? (
                'Gerando...'
              ) : !selectedMaterials.size ? (
                'Selecione materiais acima'
              ) : !selectedCooperativa ? (
                'Selecione um ponto no mapa'
              ) : (
                <>
                  <QrCode className="h-5 w-5 mr-2" />
                  Gerar QR Code de Entrega
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Dialog para Entradas Diversas */}
      <Dialog open={showDiverseDialog} onOpenChange={setShowDiverseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent" />
              Entradas Diversas
            </DialogTitle>
            <DialogDescription>
              Adicione materiais recicláveis que não vieram de nota fiscal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Tipo de Material *</Label>
              <Select value={diverseDescription} onValueChange={setDiverseDescription}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Misto (diversos tipos)">Misto (diversos tipos)</SelectItem>
                  <SelectItem value="Plástico">Plástico</SelectItem>
                  <SelectItem value="Papel / Papelão">Papel / Papelão</SelectItem>
                  <SelectItem value="Vidro">Vidro</SelectItem>
                  <SelectItem value="Metal / Alumínio">Metal / Alumínio</SelectItem>
                  <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                  <SelectItem value="Óleo de cozinha">Óleo de cozinha</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {diverseDescription === "Misto (diversos tipos)" && (
              <Button
                onClick={() => {
                  setShowDiverseDialog(false);
                  setShowRotasDialog(true);
                }}
                variant="outline"
                className="w-full border-success text-success hover:bg-success/10"
              >
                <Route className="mr-2 h-4 w-4" />
                Aderir a Rotas de Coleta
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="peso">
                Peso aproximado (kg) <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="peso"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 2,5"
                value={diverseWeight}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,]/g, '');
                  const parts = value.split(',');
                  if (parts.length <= 2) {
                    setDiverseWeight(value);
                  }
                }}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ⚖️ O peso exato será definido pelo operador no momento da coleta.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiverseDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddDiverseEntry} 
              disabled={addingDiverse || !diverseDescription.trim()}
              variant="accent"
            >
              {addingDiverse ? 'Adicionando...' : 'Adicionar Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RotasAdesaoDialog 
        open={showRotasDialog} 
        onOpenChange={setShowRotasDialog} 
      />
    </div>
  );
};

export default SelectMaterialsForDelivery;
