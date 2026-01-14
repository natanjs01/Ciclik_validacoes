import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, AlertCircle, CheckCircle2, Camera, Info, Loader2, Package, Route, User, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatWeight } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const READER_ID = "qr-code-reader-container";

type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'scanning' | 'processing' | 'error';

export default function CooperativeScanQRCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'entrega' | 'rota'>('entrega');
  const [rotaSelecionada, setRotaSelecionada] = useState<string>('');
  const [entregasAtivas, setEntregasAtivas] = useState<any[]>([]);
  const [rotas, setRotas] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Refs para evitar conflitos de estado
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup completo do scanner
  const cleanupScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch (err) {
      // Scanner já pode estar parado
    }

    try {
      scanner.clear();
    } catch (err) {
      // Ignorar erro ao limpar
    }

    scannerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanupScanner();
    };
  }, [cleanupScanner]);

  // Carregar dados iniciais (entregas ativas e rotas)
  useEffect(() => {
    loadEntregasAtivas();
    loadRotas();
  }, [user]);

  const loadEntregasAtivas = async () => {
    if (!user) return;
    
    try {
      const { data: coopData } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user.id)
        .single();

      if (!coopData) return;

      const { data: entregas, error } = await supabase
        .from('entregas_reciclaveis')
        .select(`
          *,
          usuario:profiles!id_usuario(nome, telefone)
        `)
        .eq('id_cooperativa', coopData.id)
        .eq('status_promessa', 'ativa')
        .order('data_geracao', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (entregas) setEntregasAtivas(entregas);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadRotas = async () => {
    if (!user) return;
    
    try {
      const { data: coopData } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user.id)
        .single();

      if (!coopData) return;

      const { data: rotasData, error } = await supabase
        .from('rotas_coleta')
        .select(`
          *,
          adesoes_ativas:usuarios_rotas(count)
        `)
        .eq('id_operador', coopData.id)
        .eq('status', 'ativa');

      if (error) throw error;
      if (rotasData) setRotas(rotasData);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    }
  };

  // Solicitar permissão de câmera explicitamente
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      setCameraStatus('requesting');
      setErrorMessage(null);

      // Verificar se API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera');
      }

      // Solicitar permissão explicitamente
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Permissão concedida - liberar stream imediatamente
      stream.getTracks().forEach(track => track.stop());

      if (isMountedRef.current) {
        setCameraStatus('granted');
      }
      return true;

    } catch (err: any) {
      console.error("Erro ao solicitar permissão:", err);
      
      if (isMountedRef.current) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraStatus('denied');
          setErrorMessage('Você negou o acesso à câmera. Permita o acesso nas configurações do navegador.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraStatus('error');
          setErrorMessage('Nenhuma câmera foi encontrada no dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraStatus('error');
          setErrorMessage('A câmera está sendo usada por outro aplicativo.');
        } else {
          setCameraStatus('error');
          setErrorMessage(err.message || 'Erro ao acessar a câmera');
        }
      }
      return false;
    }
  };

  // Iniciar o scanner de QR Code
  const startScanner = async () => {
    if (isProcessingRef.current) return;

    try {
      // Aguardar um frame para garantir que o DOM está pronto
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const readerElement = document.getElementById(READER_ID);
      if (!readerElement) {
        console.error("Elemento reader não encontrado");
        toast.error("Erro interno", { description: "Elemento do scanner não encontrado" });
        setCameraStatus('idle');
        return;
      }

      // Limpar scanner anterior
      await cleanupScanner();

      // Criar nova instância
      const html5QrCode = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = html5QrCode;

      setCameraStatus('scanning');

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // Ignorar erros contínuos de leitura
      );

    } catch (err: any) {
      console.error("Erro ao iniciar scanner:", err);
      
      await cleanupScanner();

      if (isMountedRef.current) {
        const msg = err?.message || String(err);
        
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setCameraStatus('denied');
          setErrorMessage('Permissão de câmera negada');
        } else {
          setCameraStatus('error');
          setErrorMessage('Não foi possível iniciar o scanner');
        }
        
        toast.error("Erro ao iniciar scanner", {
          description: "Verifique as permissões e tente novamente"
        });
      }
    }
  };

  // Parar scanner manualmente
  const stopScanner = async () => {
    await cleanupScanner();
    if (isMountedRef.current) {
      setCameraStatus('idle');
    }
  };

  // Handler de leitura bem-sucedida
  const onScanSuccess = async (decodedText: string) => {
    // Prevenir processamento múltiplo
    if (isProcessingRef.current) {
      console.log('[Scanner] Já está processando, ignorando leitura duplicada');
      return;
    }
    
    console.log('[Scanner] QR Code lido com sucesso, iniciando processamento...');
    isProcessingRef.current = true;

    if (isMountedRef.current) {
      setCameraStatus('processing');
    }

    // Parar scanner imediatamente
    await cleanupScanner();

    // Processar QR Code
    await processQRCode(decodedText);

    isProcessingRef.current = false;
  };

  // Processar e validar QR Code
  const processQRCode = async (qrData: string) => {
    try {
      console.log('[QRCode] Dados lidos:', qrData);
      
      // Parse JSON
      let data;
      try {
        data = JSON.parse(qrData);
        console.log('[QRCode] Dados parseados:', data);
      } catch (parseError) {
        console.error('[QRCode] Erro ao fazer parse do JSON:', parseError);
        toast.error("QR Code inválido", { 
          description: "Formato não reconhecido. Tente escanear novamente." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Validar tipo e rotear para o processamento correto
      console.log('[QRCode] Validando tipo:', data.tipo);
      
      if (data.tipo === 'promessa_entrega_ciclik') {
        // Processar QR Code de entrega
        await processEntregaQRCode(data);
      } else if (data.tipo === 'adesao_rota_ciclik') {
        // Processar QR Code de adesão a rota
        await processAdesaoRotaQRCode(data);
      } else {
        console.warn('[QRCode] Tipo não suportado:', data.tipo);
        toast.error("QR Code não suportado", { 
          description: `Este tipo de QR Code não pode ser processado aqui. Tipo: ${data.tipo || 'indefinido'}` 
        });
        if (isMountedRef.current) setCameraStatus('idle');
      }

    } catch (error: any) {
      console.error("[QRCode] Erro ao processar QR Code:", error);
      toast.error("Erro ao processar", { 
        description: error.message || "Tente novamente" 
      });
      if (isMountedRef.current) setCameraStatus('idle');
    }
  };

  // Processar QR Code de adesão a rota
  const processAdesaoRotaQRCode = async (data: any) => {
    try {
      console.log('[QRCode] Processando adesão a rota:', data);
      
      // Buscar cooperativa do usuário
      console.log('[QRCode] Buscando cooperativa do usuário:', user?.id);
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .single();

      if (coopError || !coopData) {
        console.error('[QRCode] Erro ao buscar cooperativa:', coopError);
        toast.error("Cooperativa não encontrada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Cooperativa encontrada:', coopData.id);
      
      // Buscar adesão ativa do usuário à rota
      console.log('[QRCode] Buscando adesão - QRCode:', data.qrcode, 'Hash:', data.hash);
      const { data: adesao, error: adesaoError } = await supabase
        .from('usuarios_rotas')
        .select(`
          *,
          rota:rotas_coleta!id_rota (
            id,
            nome,
            id_operador
          ),
          usuario:profiles!id_usuario (
            id,
            nome
          )
        `)
        .eq('qrcode_adesao', data.qrcode)
        .eq('hash_qrcode', data.hash)
        .eq('status', 'ativa')
        .single();

      if (adesaoError || !adesao) {
        console.error('[QRCode] Erro ao buscar adesão:', adesaoError);
        toast.error("QR Code inválido", { 
          description: "Adesão não encontrada ou inativa" 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Adesão encontrada:', adesao);
      
      // Verificar se a cooperativa é a operadora da rota
      console.log('[QRCode] Verificando operador - Rota:', adesao.rota?.id_operador, 'Cooperativa:', coopData.id);
      if (adesao.rota?.id_operador !== coopData.id) {
        toast.error("QR Code de outra rota", {
          description: "Esta rota não é operada por sua cooperativa"
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Criando nova entrega automática para coleta de rota...');
      console.log('[QRCode] ID Usuário Adesão:', adesao.id_usuario);
      console.log('[QRCode] ID Cooperativa:', coopData.id);
      console.log('[QRCode] User Auth:', user?.id);
      
      // Criar nova entrega automaticamente
      const entregaId = crypto.randomUUID();
      const qrcodeId = crypto.randomUUID();
      const hashQRCode = `${adesao.id_usuario}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      console.log('[QRCode] Dados do INSERT:', {
        id: entregaId,
        id_usuario: adesao.id_usuario,
        id_cooperativa: coopData.id,
        qrcode_id: qrcodeId,
        hash_qrcode: hashQRCode
      });
      
      const { data: novaEntrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .insert({
          id: entregaId,
          id_usuario: adesao.id_usuario,
          id_cooperativa: coopData.id,
          qrcode_id: qrcodeId,
          hash_qrcode: hashQRCode,
          tipo_material: 'Rota de Coleta',
          status: 'recebida',
          status_promessa: 'em_coleta',
          data_geracao: new Date().toISOString(),
          data_recebimento: new Date().toISOString(),
          peso_estimado: 0,
          itens_vinculados: {
            tipo: 'rota',
            id_rota: adesao.id_rota,
            nome_rota: adesao.rota?.nome,
            id_adesao: adesao.id
          }
        })
        .select()
        .single();

      if (entregaError) {
        console.error('[QRCode] Erro ao criar entrega:', entregaError);
        toast.error("Erro ao criar entrega", { 
          description: entregaError.message 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Entrega criada com sucesso:', novaEntrega.id);
      
      toast.success("QR Code de Rota validado!", { 
        description: `Usuário: ${adesao.usuario?.nome || 'N/A'}. Iniciando registro de coleta...` 
      });

      console.log('[QRCode] Redirecionando para registro de materiais:', novaEntrega.id);
      
      // Redirecionar para registro de materiais
      if (isMountedRef.current) {
        navigate(`/cooperative/register-materials/${novaEntrega.id}`);
      }
      
    } catch (error: any) {
      console.error('[QRCode] Erro ao processar adesão a rota:', error);
      toast.error("Erro ao processar QR Code de rota", {
        description: error.message || "Tente novamente"
      });
      if (isMountedRef.current) setCameraStatus('idle');
    }
  };

  // Processar QR Code de entrega
  const processEntregaQRCode = async (data: any) => {
    try {

      // Buscar cooperativa do usuário
      console.log('[QRCode] Buscando cooperativa do usuário:', user?.id);
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .single();

      if (coopError || !coopData) {
        console.error('[QRCode] Erro ao buscar cooperativa:', coopError);
        toast.error("Cooperativa não encontrada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Cooperativa encontrada:', coopData.id);
      console.log('[QRCode] Buscando entrega com id:', data.id_entrega, 'hash:', data.hash);
      
      // Buscar entrega
      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id', data.id_entrega)
        .eq('hash_qrcode', data.hash)
        .single();

      if (entregaError || !entrega) {
        console.error('[QRCode] Erro ao buscar entrega:', entregaError);
        console.log('[QRCode] Entrega encontrada:', entrega);
        
        // Tentar buscar só pelo ID para debug
        const { data: entregaDebug } = await supabase
          .from('entregas_reciclaveis')
          .select('id, hash_qrcode, id_cooperativa, status_promessa')
          .eq('id', data.id_entrega)
          .single();
        
        console.log('[QRCode] Debug - Entrega pelo ID:', entregaDebug);
        
        if (entregaDebug && entregaDebug.hash_qrcode !== data.hash) {
          toast.error("QR Code inválido", { 
            description: "Hash de segurança não corresponde. O QR Code pode ter sido adulterado." 
          });
        } else {
          toast.error("QR Code inválido", { 
            description: "Entrega não encontrada no sistema." 
          });
        }
        
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] Entrega encontrada:', entrega.id, 'Status:', entrega.status_promessa);

      // Verificar cooperativa
      console.log('[QRCode] Verificando cooperativa - Entrega:', entrega.id_cooperativa, 'Usuário:', coopData.id);
      if (entrega.id_cooperativa !== coopData.id) {
        toast.error("QR Code de outra cooperativa", {
          description: "Esta entrega não é destinada à sua cooperativa"
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar validade (24h)
      const dataGeracao = new Date(entrega.data_geracao);
      const agora = new Date();
      const diferencaHoras = (agora.getTime() - dataGeracao.getTime()) / (1000 * 60 * 60);

      console.log('[QRCode] Verificando validade - Geração:', dataGeracao, 'Agora:', agora, 'Horas:', diferencaHoras);

      if (diferencaHoras > 24) {
        toast.error("QR Code expirado", { description: "Válido por apenas 24 horas" });

        await supabase
          .from('entregas_reciclaveis')
          .update({ status_promessa: 'expirada', status: 'expirada' })
          .eq('id', entrega.id);

        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar status
      console.log('[QRCode] Status da promessa:', entrega.status_promessa);
      if (entrega.status_promessa === 'finalizada') {
        toast.error("Entrega já finalizada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      if (entrega.status_promessa === 'expirada' || entrega.status_promessa === 'cancelada') {
        toast.error(`Entrega ${entrega.status_promessa}`);
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Atualizar status se necessário
      if (entrega.status_promessa === 'ativa') {
        console.log('[QRCode] Atualizando status para em_coleta');
        await supabase
          .from('entregas_reciclaveis')
          .update({
            status_promessa: 'em_coleta',
            status: 'recebida',
            data_recebimento: new Date().toISOString()
          })
          .eq('id', entrega.id);

        toast.success("QR Code validado!", { description: "Iniciando registro..." });
      } else {
        toast.success("Continuando registro...");
      }

      console.log('[QRCode] Preparando redirecionamento para:', entrega.id);
      console.log('[QRCode] isMountedRef.current:', isMountedRef.current);
      
      // Redirecionar imediatamente (sem setTimeout)
      if (isMountedRef.current) {
        console.log('[QRCode] Navegando para /cooperative/register-materials/' + entrega.id);
        navigate(`/cooperative/register-materials/${entrega.id}`);
      } else {
        console.warn('[QRCode] Componente foi desmontado, cancelando navegação');
      }

    } catch (error: any) {
      console.error("[QRCode] Erro ao processar entrega:", error);
      toast.error("Erro ao processar entrega", { 
        description: error.message || "Tente novamente" 
      });
      if (isMountedRef.current) setCameraStatus('idle');
    }
  };

  // Fluxo: solicitar permissão e depois iniciar scanner
  const handleStartScanning = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      await startScanner();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate('/cooperative')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Abas para diferenciar tipo de scan */}
        <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as 'entrega' | 'rota')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="entrega" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Entrega Direta
            </TabsTrigger>
            <TabsTrigger value="rota" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Coleta de Rota
            </TabsTrigger>
          </TabsList>

          {/* ABA: Entrega Direta */}
          <TabsContent value="entrega" className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Escanear Entrega Direta</CardTitle>
                    <CardDescription>
                      Para usuários que vêm até a cooperativa entregar materiais
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Lista de entregas esperadas */}
                {!loadingData && entregasAtivas.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Esperando agora:</p>
                      <Badge variant="secondary">{entregasAtivas.length} {entregasAtivas.length === 1 ? 'entrega' : 'entregas'}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {entregasAtivas.slice(0, 5).map((entrega) => (
                        <Alert key={entrega.id} className="bg-primary/5">
                          <User className="h-4 w-4 text-primary" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>{entrega.usuario?.nome || 'Usuário'}</strong>
                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                  <span>{entrega.tipo_material}</span>
                                  <span>•</span>
                                  <span>{formatWeight(entrega.peso_estimado || 0)}</span>
                                  <span>•</span>
                                  <Clock className="h-3 w-3 inline" />
                                  <span>{formatDistanceToNow(new Date(entrega.data_geracao), { locale: ptBR, addSuffix: true })}</span>
                                </div>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                      {entregasAtivas.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          + {entregasAtivas.length - 5} entregas aguardando
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!loadingData && entregasAtivas.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma entrega direta aguardando no momento
                    </AlertDescription>
                  </Alert>
                )}

                {/* Container do scanner */}
                <div 
                  id={READER_ID} 
                  className={`w-full rounded-lg overflow-hidden bg-muted/30 ${
                    cameraStatus === 'scanning' ? 'min-h-[300px]' : 'h-0 overflow-hidden'
                  }`}
                  style={{ 
                    transition: 'height 0.3s ease-in-out',
                    visibility: cameraStatus === 'scanning' ? 'visible' : 'hidden'
                  }}
                />

                {/* Estados do scanner */}
                {cameraStatus === 'idle' && (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Para escanear QR Codes, precisamos acessar a câmera do seu dispositivo.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="font-medium text-sm">Validações Automáticas:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Verifica se o QR Code pertence à sua cooperativa</li>
                        <li>✓ Verifica se está dentro do prazo de 24h</li>
                        <li>✓ Verifica se ainda não foi usado</li>
                      </ul>
                    </div>

                    <Button onClick={handleStartScanning} className="w-full" size="lg">
                      <Camera className="mr-2 h-5 w-5" />
                      Iniciar Scanner
                    </Button>
                  </div>
                )}

                {cameraStatus === 'requesting' && (
                  <div className="text-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="font-medium text-lg">Solicitando acesso à câmera...</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Autorize o acesso quando o navegador solicitar
                      </p>
                    </div>
                  </div>
                )}

                {cameraStatus === 'granted' && (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <div>
                      <p className="font-medium text-lg">Permissão concedida!</p>
                      <p className="text-sm text-muted-foreground mt-2">Iniciando câmera...</p>
                    </div>
                  </div>
                )}

                {cameraStatus === 'denied' && (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errorMessage || 'Acesso à câmera foi negado.'}
                      </AlertDescription>
                    </Alert>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Como permitir:</strong> Clique no ícone de cadeado na barra de endereço 
                        e altere a permissão da câmera para "Permitir".
                      </p>
                    </div>

                    <Button onClick={handleStartScanning} className="w-full" size="lg">
                      <Camera className="mr-2 h-5 w-5" />
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {cameraStatus === 'processing' && (
                  <div className="text-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="font-medium text-lg">Processando QR Code...</p>
                      <p className="text-sm text-muted-foreground mt-2">Aguarde...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Coleta de Rota */}
          <TabsContent value="rota" className="space-y-4">
            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle>Escanear Coleta de Rota</CardTitle>
                    <CardDescription>
                      Para coletas em rotas programadas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Seletor de rota */}
                {!loadingData && rotas.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selecione a rota que está coletando</Label>
                    <Select value={rotaSelecionada} onValueChange={setRotaSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a rota" />
                      </SelectTrigger>
                      <SelectContent>
                        {rotas.map((rota) => (
                          <SelectItem key={rota.id} value={rota.id}>
                            {rota.nome} ({rota.adesoes_ativas?.[0]?.count || 0} adesões)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!loadingData && rotas.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma rota ativa atribuída à sua cooperativa
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info da rota selecionada */}
                {rotaSelecionada && rotas.find(r => r.id === rotaSelecionada) && (
                  <Alert className="bg-accent/5 border-accent/20">
                    <Route className="h-4 w-4 text-accent" />
                    <AlertDescription>
                      <div>
                        <strong className="text-accent">
                          {rotas.find(r => r.id === rotaSelecionada)?.nome}
                        </strong>
                        <p className="text-sm mt-1">
                          {rotas.find(r => r.id === rotaSelecionada)?.adesoes_ativas?.[0]?.count || 0} adesões ativas nesta rota
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Container do scanner */}
                {rotaSelecionada && (
                  <>
                    <div 
                      id={READER_ID} 
                      className={`w-full rounded-lg overflow-hidden bg-muted/30 ${
                        cameraStatus === 'scanning' ? 'min-h-[300px]' : 'h-0 overflow-hidden'
                      }`}
                      style={{ 
                        transition: 'height 0.3s ease-in-out',
                        visibility: cameraStatus === 'scanning' ? 'visible' : 'hidden'
                      }}
                    />

                    {/* Estados do scanner */}
                    {cameraStatus === 'idle' && (
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Escaneie o QR Code do morador que aderiu a esta rota.
                          </AlertDescription>
                        </Alert>

                        <Button onClick={handleStartScanning} className="w-full" size="lg">
                          <Camera className="mr-2 h-5 w-5" />
                          Iniciar Scanner
                        </Button>
                      </div>
                    )}

                    {cameraStatus === 'requesting' && (
                      <div className="text-center py-8 space-y-4">
                        <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto" />
                        <div>
                          <p className="font-medium text-lg">Solicitando acesso à câmera...</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Autorize o acesso quando o navegador solicitar
                          </p>
                        </div>
                      </div>
                    )}

                    {cameraStatus === 'granted' && (
                      <div className="text-center py-8 space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
                        <div>
                          <p className="font-medium text-lg">Permissão concedida!</p>
                          <p className="text-sm text-muted-foreground mt-2">Iniciando câmera...</p>
                        </div>
                      </div>
                    )}

                    {cameraStatus === 'denied' && (
                      <div className="space-y-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {errorMessage || 'Acesso à câmera foi negado.'}
                          </AlertDescription>
                        </Alert>

                        <Button onClick={handleStartScanning} className="w-full" size="lg">
                          <Camera className="mr-2 h-5 w-5" />
                          Tentar Novamente
                        </Button>
                      </div>
                    )}

                    {cameraStatus === 'processing' && (
                      <div className="text-center py-8 space-y-4">
                        <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto" />
                        <div>
                          <p className="font-medium text-lg">Processando QR Code...</p>
                          <p className="text-sm text-muted-foreground mt-2">Aguarde...</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!rotaSelecionada && rotas.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Selecione uma rota acima para começar a escanear QR Codes
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
