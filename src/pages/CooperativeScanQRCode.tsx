import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, AlertCircle, CheckCircle2, Camera, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Alert, AlertDescription } from '@/components/ui/alert';

const READER_ID = "qr-code-reader-container";

type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'scanning' | 'processing' | 'error';

export default function CooperativeScanQRCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
      console.log("Cleanup - stop:", err);
    }

    try {
      scanner.clear();
    } catch (err) {
      console.log("Cleanup - clear:", err);
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
    if (isProcessingRef.current) return;
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
      // Parse JSON
      let data;
      try {
        data = JSON.parse(qrData);
      } catch {
        toast.error("QR Code inválido", { description: "Formato não reconhecido" });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Validar tipo
      if (data.tipo !== 'promessa_entrega_ciclik') {
        toast.error("QR Code inválido", { description: "Este não é um QR Code de entrega Ciclik" });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Buscar cooperativa do usuário
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .single();

      if (coopError || !coopData) {
        toast.error("Cooperativa não encontrada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Buscar entrega
      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id', data.id_entrega)
        .eq('hash_qrcode', data.hash)
        .single();

      if (entregaError || !entrega) {
        toast.error("QR Code inválido", { description: "Entrega não encontrada" });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar cooperativa
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

      // Redirecionar
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate(`/cooperative/register-materials/${entrega.id}`);
        }
      }, 800);

    } catch (error: any) {
      console.error("Erro ao processar QR Code:", error);
      toast.error("Erro ao processar", { description: "Tente novamente" });
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
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate('/cooperative')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              Escanear QR Code de Entrega
            </CardTitle>
            <CardDescription>
              Aponte a câmera para o QR Code do usuário
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Container do scanner - SEMPRE renderizado mas oculto quando não está escaneando */}
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

            {/* Estado: Idle */}
            {cameraStatus === 'idle' && (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Para escanear QR Codes, precisamos acessar a câmera do seu dispositivo.
                    Clique no botão abaixo e autorize o acesso quando solicitado.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Validações Automáticas</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>✓ Verifica se o QR Code pertence à sua cooperativa</li>
                        <li>✓ Verifica se está dentro do prazo de 24h</li>
                        <li>✓ Verifica se ainda não foi usado</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={handleStartScanning} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Iniciar Scanner
                </Button>
              </div>
            )}

            {/* Estado: Solicitando permissão */}
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

            {/* Estado: Permissão concedida (transição rápida) */}
            {cameraStatus === 'granted' && (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <p className="font-medium text-lg">Permissão concedida!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Iniciando câmera...
                  </p>
                </div>
              </div>
            )}

            {/* Estado: Permissão negada */}
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
                    do navegador e altere a permissão da câmera para "Permitir".
                  </p>
                </div>

                <Button onClick={handleStartScanning} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Tentar Novamente
                </Button>
              </div>
            )}

            {/* Estado: Erro genérico */}
            {cameraStatus === 'error' && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage || 'Ocorreu um erro ao acessar a câmera.'}
                  </AlertDescription>
                </Alert>

                <Button onClick={handleStartScanning} className="w-full" size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Tentar Novamente
                </Button>
              </div>
            )}

            {/* Estado: Escaneando */}
            {cameraStatus === 'scanning' && (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Posicione o QR Code dentro da área destacada para realizar a leitura
                  </AlertDescription>
                </Alert>

                <Button onClick={stopScanner} variant="outline" className="w-full">
                  Cancelar Leitura
                </Button>
              </div>
            )}

            {/* Estado: Processando */}
            {cameraStatus === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <QrCode className="h-16 w-16 text-primary animate-pulse mx-auto" />
                <div>
                  <p className="font-medium text-lg">Validando QR Code...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aguarde enquanto verificamos as informações
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
