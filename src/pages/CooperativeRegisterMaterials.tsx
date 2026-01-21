import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, CheckCircle, Package, Save, AlertCircle, X, AlertTriangle, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatWeight, formatNumber } from '@/lib/formatters';
import { generateQRCodeWithLogo } from '@/utils/qrCodeWithLogo';

interface MaterialRegistrado {
  id: string;
  tipo_material: string;
  subtipo_material: string;
  peso_kg: number;
}

// ✅ VALORES ATUALIZADOS PARA CORRESPONDER AO BANCO DE DADOS
const TIPOS_MATERIAL = {
  'Plástico': ['PET', 'PP', 'PEAD', 'PEBD', 'PVC', 'PS', 'OUTROS_PLASTICOS'],
  'Papel': ['PAPEL_BRANCO', 'PAPEL_MISTO', 'PAPELAO', 'PAPELAO_ONDULADO', 'JORNAL', 'REVISTA'],
  'Vidro': ['VIDRO_INCOLOR', 'VIDRO_VERDE', 'VIDRO_AMBAR'],
  'Metal': ['ALUMINIO', 'ACO', 'COBRE', 'OUTROS_METAIS'],
  'Laminado': ['TETRAPACK']
};

const LABELS_SUBMATERIAL: Record<string, string> = {
  // Plásticos
  'PET': 'PET (Garrafas)',
  'PP': 'PP (Potes)',
  'PEAD': 'PEAD (Embalagens rígidas)',
  'PEBD': 'PEBD (Sacolas)',
  'PVC': 'PVC',
  'PS': 'PS (Isopor)',
  'OUTROS_PLASTICOS': 'Outros Plásticos',
  
  // Papéis
  'PAPEL_BRANCO': 'Papel Branco',
  'PAPEL_MISTO': 'Papel Misto',
  'PAPELAO': 'Papelão',
  'PAPELAO_ONDULADO': 'Papelão Ondulado',
  'JORNAL': 'Jornal',
  'REVISTA': 'Revista',
  
  // Vidros
  'VIDRO_INCOLOR': 'Vidro Incolor',
  'VIDRO_VERDE': 'Vidro Verde',
  'VIDRO_AMBAR': 'Vidro Âmbar',
  
  // Metais
  'ALUMINIO': 'Alumínio',
  'ACO': 'Aço',
  'COBRE': 'Cobre',
  'OUTROS_METAIS': 'Outros Metais',
  
  // Laminados
  'TETRAPACK': 'Tetra Pak (Caixa de Leite)',
  
  // Rejeito
  'REJEITO': 'Rejeito (Não Reciclável)'
};

export default function CooperativeRegisterMaterials() {
  const navigate = useNavigate();
  const { entregaId } = useParams();
  const { user } = useAuth();
  
  const [entrega, setEntrega] = useState<any>(null);
  const [cooperativaId, setCooperativaId] = useState<string>("");
  const [materiaisRegistrados, setMateriaisRegistrados] = useState<MaterialRegistrado[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");
  const [subtipoSelecionado, setSubtipoSelecionado] = useState<string>("");
  const [peso, setPeso] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [salvandoAuto, setSalvandoAuto] = useState(false);
  const [adicionandoMaterial, setAdicionandoMaterial] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [qrcodeTriagem, setQrcodeTriagem] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Auto-save quando materiais mudam
  useEffect(() => {
    if (materiaisRegistrados.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setSalvandoAuto(true);
        setTimeout(() => setSalvandoAuto(false), 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [materiaisRegistrados, loading]);

  useEffect(() => {
    loadEntrega();
    loadMateriaisRegistrados();
  }, [entregaId]);

  const loadEntrega = async () => {
    try {
      // Buscar cooperativa
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .maybeSingle();

      if (coopError) throw coopError;
      if (!coopData) throw new Error("Cooperativa não encontrada");
      
      setCooperativaId(coopData.id);

      // Buscar entrega
      const { data: entregaData, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id', entregaId)
        .maybeSingle();

      if (entregaError) throw entregaError;
      if (!entregaData) throw new Error("Entrega não encontrada");
      
      setEntrega(entregaData);
    } catch (error: any) {
      toast.error("Erro ao carregar entrega", {
        description: error.message
      });
      navigate('/cooperative');
    } finally {
      setLoading(false);
    }
  };

  const loadMateriaisRegistrados = async () => {
    const { data, error } = await supabase
      .from('materiais_coletados_detalhado')
      .select('*')
      .eq('id_entrega', entregaId);

    if (!error && data) {
      setMateriaisRegistrados(data);
    }
  };

  const adicionarMaterial = async () => {
    // Evitar cliques duplos
    if (adicionandoMaterial) {
      console.log('⚠️ Já existe uma operação em andamento');
      return;
    }

    // Validações de campos
    if (!tipoSelecionado || !peso) {
      toast.error("Preencha tipo e peso");
      return;
    }

    if (tipoSelecionado !== 'Rejeito' && !subtipoSelecionado) {
      toast.error("Selecione o submaterial");
      return;
    }

    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      toast.error("Peso inválido");
      return;
    }

    // ✅ NOVA VALIDAÇÃO: Verificar se IDs estão carregados
    if (!cooperativaId || !entregaId) {
      console.error('❌ IDs não carregados:', { cooperativaId, entregaId });
      toast.error("Aguarde o carregamento completo da página");
      return;
    }

    setAdicionandoMaterial(true);

    try {
      const payload = {
        id_entrega: entregaId,
        id_cooperativa: cooperativaId,
        tipo_material: tipoSelecionado,
        subtipo_material: tipoSelecionado === 'Rejeito' ? 'REJEITO' : subtipoSelecionado,
        peso_kg: pesoNum
      };

      // ✅ LOG: Registrar tentativa de inserção
      console.log('📦 Inserindo material:', payload);

      const { data, error } = await supabase
        .from('materiais_coletados_detalhado')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // ✅ LOG: Erro detalhado
        console.error('❌ Erro ao inserir material:', {
          error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
          payload
        });
        throw error;
      }

      // ✅ LOG: Sucesso
      console.log('✅ Material inserido com sucesso:', data);

      setMateriaisRegistrados([...materiaisRegistrados, data]);
      
      // Limpar campos
      setTipoSelecionado("");
      setSubtipoSelecionado("");
      setPeso("");
      
      toast.success("✓ Salvo", { duration: 1500 });
    } catch (error: any) {
      toast.error("Erro ao registrar", {
        description: error.message || "Tente novamente"
      });
    } finally {
      setAdicionandoMaterial(false);
    }
  };

  const removerMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materiais_coletados_detalhado')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMateriaisRegistrados(materiaisRegistrados.filter(m => m.id !== id));
      toast.success("✓ Removido", { duration: 1500 });
    } catch (error: any) {
      toast.error("Erro ao remover", {
        description: error.message
      });
    }
  };

  const finalizarColeta = async () => {
    if (materiaisRegistrados.length === 0) {
      toast.error("Adicione pelo menos um material antes de enviar para triagem");
      return;
    }

    setFinalizando(true);

    try {
      // Verificar se a entrega já está finalizada
      const { data: entregaAtual, error: checkError } = await supabase
        .from('entregas_reciclaveis')
        .select('status_promessa, status')
        .eq('id', entregaId)
        .single();

      if (checkError) throw checkError;

      if (entregaAtual.status_promessa === 'finalizada') {
        toast.error("Esta entrega já foi finalizada anteriormente");
        setTimeout(() => navigate('/cooperative'), 1500);
        return;
      }

      // Calcular totais
      const pesoTotal = materiaisRegistrados.reduce((sum, m) => sum + m.peso_kg, 0);
      
      // Gerar QR Code para triagem
      const qrcodeTriagem = `TRIAGEM_${entregaId}_${Date.now()}`;

      // Enviar para triagem em vez de finalizar
      const { error: enviarTriagemError } = await supabase
        .from('entregas_reciclaveis')
        .update({
          status_promessa: 'em_triagem',
          peso_validado: pesoTotal,
          qrcode_triagem: qrcodeTriagem,
          data_envio_triagem: new Date().toISOString()
        })
        .eq('id', entregaId)
        .eq('status_promessa', 'em_coleta'); // Garantir que só atualize se estiver em_coleta

      if (enviarTriagemError) throw enviarTriagemError;

      // Criar notificação para o usuário
      await supabase
        .from('notificacoes')
        .insert({
          id_usuario: entrega.id_usuario,
          tipo: 'entrega_enviada_triagem',
          mensagem: `Sua entrega foi registrada! Peso: ${formatWeight(pesoTotal)} | Aguardando triagem`
        });

      // Armazenar QR Code e mostrar modal
      setQrcodeTriagem(qrcodeTriagem);
      
      // Gerar QR Code com logo
      try {
        const qrWithLogo = await generateQRCodeWithLogo({
          data: qrcodeTriagem,
          width: 400,
          margin: 2
        });
        setQrCodeDataUrl(qrWithLogo);
      } catch (error) {
        console.error('Erro ao gerar QR Code com logo:', error);
      }
      
      setShowQRCodeModal(true);

      toast.success("Materiais enviados para triagem!", {
        description: `QR Code gerado com sucesso`
      });

    } catch (error: any) {
      toast.error("Erro ao enviar para triagem", {
        description: error.message
      });
    } finally {
      setFinalizando(false);
    }
  };

  const cancelarColeta = async () => {
    setCancelando(true);
    
    try {
      // 1. Deletar todos os materiais registrados
      if (materiaisRegistrados.length > 0) {
        const { error: deleteError } = await supabase
          .from('materiais_coletados_detalhado')
          .delete()
          .eq('id_entrega', entregaId);

        if (deleteError) throw deleteError;
      }

      // 2. Reverter status da entrega para 'ativa' (promessa ativa novamente)
      const { error: updateError } = await supabase
        .from('entregas_reciclaveis')
        .update({
          status_promessa: 'ativa',
          status: 'gerada',
          data_recebimento: null
        })
        .eq('id', entregaId);

      if (updateError) throw updateError;

      toast.success("Coleta cancelada com sucesso", {
        description: "A entrega voltou ao status de promessa ativa"
      });

      setTimeout(() => {
        navigate('/cooperative');
      }, 1500);

    } catch (error: any) {
      toast.error("Erro ao cancelar coleta", {
        description: error.message
      });
      setCancelando(false);
    }
  };

  const handlePrintQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Bloqueador de pop-up impediu a impressão');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Triagem</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 10px;
            }
            h1 { margin: 0 0 20px 0; font-size: 24px; }
            .qrcode { margin: 20px 0; }
            .qrcode img { width: 400px; height: 400px; }
            .code { 
              font-family: monospace; 
              font-size: 14px; 
              margin-top: 20px;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 5px;
            }
            .info { margin-top: 20px; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 TRIAGEM - CICLIK</h1>
            <div class="qrcode">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
            <div class="code">
              <strong>Código:</strong><br/>
              ${qrcodeTriagem}
            </div>
            <div class="info">
              Entrega ID: ${entregaId?.slice(0, 8)}<br/>
              Data: ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-triagem-${entregaId?.slice(0, 8)}.png`;
    link.click();
    toast.success('QR Code baixado com sucesso!');
  };

  const handleCloseQRModal = () => {
    setShowQRCodeModal(false);
    navigate('/cooperative');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const pesoTotal = materiaisRegistrados.reduce((sum, m) => sum + m.peso_kg, 0);
  const pesoRejeito = materiaisRegistrados
    .filter(m => m.subtipo_material === 'REJEITO')
    .reduce((sum, m) => sum + m.peso_kg, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button
          onClick={() => navigate('/cooperative')}
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Registrar Materiais Coletados
              {salvandoAuto && (
                <Badge variant="outline" className="ml-auto">
                  <Save className="h-3 w-3 mr-1" />
                  Salvando...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Entrega #{entrega?.id?.slice(0, 8)} | Peso estimado: {formatWeight(entrega?.peso_estimado || 0)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alerta Informativo */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ✓ Adicione todos os materiais coletados (mesmo além dos prometidos)<br />
                ✓ Os dados são salvos automaticamente<br />
                ✓ Use "Rejeito" para materiais não recicláveis
              </AlertDescription>
            </Alert>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Registrado</p>
                  <p className="text-2xl font-bold text-primary">{formatWeight(pesoTotal)}</p>
                </CardContent>
              </Card>
              <Card className="bg-success/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Reciclável</p>
                  <p className="text-2xl font-bold text-success">{formatWeight(pesoTotal - pesoRejeito)}</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Rejeito</p>
                  <p className="text-2xl font-bold text-destructive">{formatWeight(pesoRejeito)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de Adição */}
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Material</Label>
                    <Select value={tipoSelecionado} onValueChange={(val) => {
                      setTipoSelecionado(val);
                      setSubtipoSelecionado("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(TIPOS_MATERIAL).map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                        <SelectItem value="Rejeito">Rejeito (Não Reciclável)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoSelecionado && tipoSelecionado !== 'Rejeito' && (
                    <div className="space-y-2">
                      <Label>Submaterial</Label>
                      <Select value={subtipoSelecionado} onValueChange={setSubtipoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_MATERIAL[tipoSelecionado as keyof typeof TIPOS_MATERIAL]?.map(sub => (
                            <SelectItem key={sub} value={sub}>
                              {LABELS_SUBMATERIAL[sub]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex: 1.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          adicionarMaterial();
                        }
                      }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={adicionarMaterial} 
                  className="w-full"
                  disabled={adicionandoMaterial || !cooperativaId || !entregaId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {adicionandoMaterial ? "Salvando..." : "Adicionar Material"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Materiais */}
            {materiaisRegistrados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Materiais Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Submaterial</TableHead>
                        <TableHead className="text-right">Peso (kg)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materiaisRegistrados.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.tipo_material}</TableCell>
                          <TableCell>
                            <Badge variant={material.subtipo_material === 'REJEITO' ? 'destructive' : 'secondary'}>
                              {LABELS_SUBMATERIAL[material.subtipo_material]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatWeight(material.peso_kg)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerMaterial(material.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={cancelando || finalizando}
                variant="outline"
                className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                size="lg"
              >
                <X className="mr-2 h-5 w-5" />
                {cancelando ? 'Cancelando...' : 'Cancelar Coleta'}
              </Button>
              
              <Button
                onClick={finalizarColeta}
                disabled={finalizando || materiaisRegistrados.length === 0 || cancelando}
                className="flex-1"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {finalizando ? 'Enviando...' : 'Enviar para Triagem'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Cancelamento */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Cancelar Coleta?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Esta ação irá cancelar completamente o processo de coleta e reverter a entrega 
                  para o status de <strong>promessa ativa</strong>.
                </p>
                {materiaisRegistrados.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{materiaisRegistrados.length}</strong> {materiaisRegistrados.length === 1 ? 'material registrado' : 'materiais registrados'} {materiaisRegistrados.length === 1 ? 'será removido' : 'serão removidos'}
                      <br />
                      <span className="text-sm">Peso total: {formatWeight(materiaisRegistrados.reduce((sum, m) => sum + m.peso_kg, 0))}</span>
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm">
                  Tem certeza que deseja continuar?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelando}>
                Não, voltar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowCancelDialog(false);
                  cancelarColeta();
                }}
                disabled={cancelando}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelando ? 'Cancelando...' : 'Sim, cancelar coleta'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal do QR Code para Triagem */}
        <Dialog open={showQRCodeModal} onOpenChange={setShowQRCodeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                QR Code Gerado com Sucesso!
              </DialogTitle>
              <DialogDescription>
                Escaneie este QR Code na estação de triagem para validar os materiais
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* QR Code com Logo */}
              <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed" id="qrcode-triagem">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code de Triagem"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Código em texto */}
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Código de Triagem:</p>
                <p className="font-mono text-sm font-medium break-all">{qrcodeTriagem}</p>
              </div>

              {/* Informações */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Próximo passo:</strong> Leve os materiais para a estação de triagem e escaneie este QR Code para iniciar a validação.
                </AlertDescription>
              </Alert>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handlePrintQRCode}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDownloadQRCode}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>

              {/* Botão de fechar */}
              <Button 
                onClick={handleCloseQRModal}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Concluir e Voltar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
