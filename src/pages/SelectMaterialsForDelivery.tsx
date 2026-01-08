import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Package, Recycle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TIPOS_EMBALAGEM_LABELS } from "@/types/produtos";
import { formatNumber } from "@/lib/formatters";
import QRCode from "qrcode";

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
  cidade: string;
  uf: string;
}

const SelectMaterialsForDelivery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [selectedCooperativa, setSelectedCooperativa] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [deliveryId, setDeliveryId] = useState<string>("");

  useEffect(() => {
    if (user) {
      verificarExpiracoesECarregar();
    }
  }, [user]);

  const verificarExpiracoesECarregar = async () => {
    try {
      // Chamar edge function para verificar e expirar promessas antigas
      // Esta função usa SERVICE_ROLE_KEY internamente e não precisa de auth do usuário
      // Com timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const invokePromise = supabase.functions.invoke('validar-expiracoes-entregas', {
        body: {},
        method: 'POST'
      });

      const result = await Promise.race([invokePromise, timeoutPromise]);
      console.log('Validação de expirações concluída:', result);
    } catch (error: any) {
      // Erro não crítico - apenas loga mas não impede o fluxo
      console.log('Aviso: verificação de expirações não completada:', error?.message || error);
    } finally {
      // Carregar materiais e cooperativas independente do resultado
      loadMateriais();
      loadCooperativas();
    }
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
      toast.error('Erro ao carregar materiais', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCooperativas = async () => {
    try {
      const { data, error } = await supabase
        .from('cooperativas')
        .select('id, nome_fantasia, cidade, uf')
        .eq('status', 'aprovada')
        .order('nome_fantasia');

      if (error) throw error;
      setCooperativas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cooperativas', {
        description: error.message
      });
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
      const { data, error, count } = await supabase
        .from('materiais_reciclaveis_usuario')
        .delete()
        .eq('id', materialId)
        .eq('id_usuario', user?.id)
        .select();

      if (error) throw error;

      // Verificar se a exclusão realmente ocorreu
      if (!data || data.length === 0) {
        // Tentar novamente sem a condição de id_usuario (pode ter RLS diferente)
        const { error: retryError } = await supabase
          .from('materiais_reciclaveis_usuario')
          .delete()
          .eq('id', materialId);
        
        if (retryError) throw retryError;
      }

      // Atualizar estado local de forma imutável
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
      // Recarregar materiais para garantir sincronização
      loadMateriais();
    }
  };

  const calcularPesoMaterialEmGramas = (material: Material): number => {
    const quantidade = material.quantidade ?? 1;
    const pesoUnitario = material.peso_unitario_gramas ?? 0;
    // Usa o peso_total_estimado_gramas, mas recalcula se vier nulo com base em quantidade × peso_unitario
    return material.peso_total_estimado_gramas ?? (quantidade * pesoUnitario);
  };

  const calcularPesoTotalEstimado = (): number => {
    const totalEmGramas = materiais
      .filter((m) => selectedMaterials.has(m.id))
      .reduce((total, m) => total + calcularPesoMaterialEmGramas(m), 0);

    return totalEmGramas / 1000; // Converter para kg
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

      // Criar entrega com hash e status de promessa
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
          peso_estimado: pesoEstimadoKg
        })
        .select()
        .single();

      if (entregaError) throw entregaError;

      // Atualizar status dos materiais para 'em_entrega'
      const { error: updateError } = await supabase
        .from('materiais_reciclaveis_usuario')
        .update({ status: 'em_entrega', id_entrega: entrega.id })
        .in('id', itensVinculados);

      if (updateError) throw updateError;

      // Preparar dados do QR Code para a cooperativa
      const qrCodeData = JSON.stringify({
        tipo: 'promessa_entrega_ciclik',
        id_entrega: entrega.id,
        hash: hashQRCode,
        id_cooperativa: selectedCooperativa,
        peso_estimado: pesoEstimadoKg.toFixed(3),
        validade: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      // Gerar QR Code com os dados da entrega
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#10B981',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrCodeDataUrl);
      setDeliveryId(entrega.id);

      toast.success('QR Code gerado com sucesso!', {
        description: `${selectedMaterials.size} materiais prontos para entrega`
      });
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code', {
        description: error.message
      });
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

  if (qrCodeUrl) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-6 w-6 text-primary" />
              Promessa de Entrega Criada
            </CardTitle>
            <CardDescription>
              Apresente este QR Code na cooperativa para realizar a entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center bg-white p-6 rounded-lg">
              <img src={qrCodeUrl} alt="QR Code" className="w-80 h-80" />
            </div>
            
            <div className="space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  ID da Promessa:
                </p>
                <p className="font-mono text-sm">{deliveryId}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Materiais</p>
                  <p className="text-lg font-bold text-primary">{selectedMaterials.size}</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Peso Estimado</p>
                  <p className="text-lg font-bold text-success">
                    {calcularPesoTotalEstimado().toFixed(3)} kg
                  </p>
                </div>
              </div>

              <div className="bg-warning/10 p-3 rounded-lg">
                <p className="text-xs text-warning font-medium mb-1">⏰ Validade</p>
                <p className="text-sm">Este QR Code expira em 24 horas</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  Baixar QR Code
                </Button>
                <Button onClick={handleNewDelivery} variant="secondary" className="flex-1">
                  Nova Entrega
                </Button>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/user')}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver Minhas Entregas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        onClick={() => navigate('/user')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Selecionar Materiais para Entrega
          </CardTitle>
          <CardDescription>
            Escolha os materiais que deseja entregar na cooperativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando materiais...</p>
          ) : materiais.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não tem materiais disponíveis para entrega.
              </p>
              <Button
                onClick={() => navigate('/upload-receipt')}
                variant="outline"
                className="mt-4"
              >
                Cadastrar Nota Fiscal
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left w-10"></th>
                        <th className="p-3 text-left">Descrição</th>
                        <th className="p-3 text-left">Tipo</th>
                        <th className="p-3 text-center">Recicl.</th>
                        <th className="p-3 text-right">Peso</th>
                        <th className="p-3 text-right">Pts</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {materiais.map((material) => (
                        <tr 
                          key={material.id} 
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => toggleMaterial(material.id)}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={selectedMaterials.has(material.id)}
                              onCheckedChange={() => toggleMaterial(material.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-3">
                            <p className="font-medium truncate max-w-[200px]">{material.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(material.data_cadastro).toLocaleDateString('pt-BR')}
                              {material.quantidade && material.quantidade > 1 && ` • Qtd: ${material.quantidade}`}
                            </p>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {TIPOS_EMBALAGEM_LABELS[material.tipo_embalagem as keyof typeof TIPOS_EMBALAGEM_LABELS]}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs">{material.percentual_reciclabilidade}%</span>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatNumber(calcularPesoMaterialEmGramas(material) / 1000, 2)} kg
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="default" className="text-xs">
                              +{material.pontos_ganhos}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMaterial(material.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Materiais selecionados:</span>
                    <Badge variant="default" className="text-lg px-4 py-1">
                      {selectedMaterials.size}
                    </Badge>
                  </div>
                  {selectedMaterials.size > 0 && (
                    <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
                      <span className="font-medium text-primary">Peso estimado total:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatNumber(calcularPesoTotalEstimado(), 2)} kg
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecionar Cooperativa</label>
                  <Select value={selectedCooperativa} onValueChange={setSelectedCooperativa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma cooperativa" />
                    </SelectTrigger>
                    <SelectContent>
                      {cooperativas.map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.nome_fantasia} - {coop.cidade}/{coop.uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateQRCode}
                  disabled={generating || selectedMaterials.size === 0 || !selectedCooperativa}
                  className="w-full"
                >
                  {generating ? 'Gerando...' : 'Gerar QR Code de Entrega'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectMaterialsForDelivery;