import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, AlertCircle, CheckCircle2, Camera, Info, Loader2, Package, Route, User, Clock, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const READER_ID = "qr-code-reader-container";

type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'scanning' | 'processing' | 'error';

export default function CooperativeScanQRCode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [entregasAtivas, setEntregasAtivas] = useState<any[]>([]);
  const [entregasEmTriagem, setEntregasEmTriagem] = useState<any[]>([]);
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
    loadEntregasEmTriagem();
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

      // Carregar entregas sem o join
      const { data: entregas, error } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('id_cooperativa', coopData.id)
        .eq('status_promessa', 'ativa')
        .order('data_geracao', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro na query de entregas:', error);
        throw error;
      }

      if (entregas && entregas.length > 0) {
        // Buscar dados dos usuários separadamente
        const userIds = [...new Set(entregas.map(e => e.id_usuario))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome, telefone')
          .in('id', userIds);

        // Mapear profiles para as entregas
        const entregasComUsuarios = entregas.map(entrega => ({
          ...entrega,
          usuario: profilesData?.find(p => p.id === entrega.id_usuario) || null
        }));

        setEntregasAtivas(entregasComUsuarios);
      } else {
        setEntregasAtivas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadEntregasEmTriagem = async () => {
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
        .select('*')
        .eq('id_cooperativa', coopData.id)
        .eq('status_promessa', 'em_triagem')
        .order('data_envio_triagem', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao carregar entregas em triagem:', error);
        throw error;
      }

      if (entregas && entregas.length > 0) {
        const userIds = [...new Set(entregas.map(e => e.id_usuario))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome, telefone')
          .in('id', userIds);

        const entregasComUsuarios = entregas.map(entrega => ({
          ...entrega,
          usuario: profilesData?.find(p => p.id === entrega.id_usuario) || null
        }));

        setEntregasEmTriagem(entregasComUsuarios);
      } else {
        setEntregasEmTriagem([]);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas em triagem:', error);
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
        .select('*, adesoes_ativas:usuarios_rotas(count)')
        .eq('id_operador', coopData.id)
        .eq('status', 'ativa');

      if (error) {
        console.error('Erro na query de rotas:', error);
        throw error;
      }
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
      console.log('═══════════════════════════════════════════════════');
      console.log('[QRCode] 📱 INICIANDO PROCESSAMENTO DE QR CODE');
      console.log('[QRCode] Dados brutos:', qrData);
      console.log('[QRCode] Tipo de dado:', typeof qrData);
      console.log('[QRCode] Tamanho:', qrData.length, 'caracteres');
      console.log('═══════════════════════════════════════════════════');
      
      // =====================================
      // TIPO 1: QR CODE DE TRIAGEM
      // Formato: TRIAGEM_id_timestamp
      // Exemplo: TRIAGEM_abc123_1234567890
      // =====================================
      if (qrData.startsWith('TRIAGEM_')) {
        console.log('✅ [TIPO 1] QR Code de TRIAGEM detectado');
        console.log('[QRCode] → Encaminhando para processTriagemQRCode()');
        await processTriagemQRCode(qrData);
        return;
      }
      
      // =====================================
      // TIPO 2: UUID SIMPLES (ENTREGA)
      // Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      // Exemplo: 25400115-c210-40ca-84e7-eb649a101758
      // Busca pela coluna qrcode_id na tabela
      // =====================================
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrData.trim())) {
        console.log('✅ [TIPO 2] UUID de ENTREGA detectado');
        console.log('[QRCode] UUID validado:', qrData.trim());
        console.log('[QRCode] → Encaminhando para processEntregaSimples()');
        await processEntregaSimples(qrData.trim());
        return;
      }
      
      // =====================================
      // TIPO 3: JSON COMPLETO
      // Formato: {"tipo":"...", "qrcode_id":"...", ...}
      // Subtipos:
      //   - promessa_entrega_ciclik (entrega)
      //   - adesao_rota_ciclik (adesão)
      // =====================================
      let data;
      try {
        data = JSON.parse(qrData);
        console.log('✅ [TIPO 3] JSON parseado com sucesso');
        console.log('[QRCode] Dados parseados:', data);
        console.log('[QRCode] Tipo identificado:', data.tipo);
      } catch (parseError) {
        console.error('❌ [ERRO] Não foi possível fazer parse do JSON:', parseError);
        console.error('[QRCode] Formato não reconhecido. Dados recebidos:', qrData);
        toast.error("QR Code inválido", { 
          description: "Formato não reconhecido. Certifique-se de estar usando um QR Code válido da Ciclik." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Validar tipo e rotear para o processamento correto
      console.log('[QRCode] Validando subtipo do JSON...');
      
      if (data.tipo === 'promessa_entrega_ciclik') {
        console.log('✅ [TIPO 3A] JSON de ENTREGA detectado');
        console.log('[QRCode] → Encaminhando para processEntregaQRCode()');
        await processEntregaQRCode(data);
      } else if (data.tipo === 'adesao_rota_ciclik') {
        console.log('✅ [TIPO 3B] JSON de ADESÃO À ROTA detectado');
        console.log('[QRCode] → Encaminhando para processAdesaoRotaQRCode()');
        await processAdesaoRotaQRCode(data);
      } else {
        console.warn('⚠️ [AVISO] Tipo não suportado:', data.tipo);
        console.warn('[QRCode] Tipos suportados: promessa_entrega_ciclik, adesao_rota_ciclik');
        toast.error("QR Code não suportado", { 
          description: `Este tipo de QR Code (${data.tipo || 'indefinido'}) não pode ser processado aqui.` 
        });
        if (isMountedRef.current) setCameraStatus('idle');
      }

    } catch (error: any) {
      console.error("❌ [ERRO FATAL] Erro ao processar QR Code:", error);
      console.error("[QRCode] Stack trace:", error.stack);
      toast.error("Erro ao processar QR Code", { 
        description: error.message || "Ocorreu um erro inesperado. Tente novamente." 
      });
      if (isMountedRef.current) setCameraStatus('idle');
    }
  };

  // Processar QR Code de triagem
  const processTriagemQRCode = async (qrData: string) => {
    try {
      console.log('[Triagem] Processando QR Code de triagem:', qrData);
      
      // Buscar entrega pelo qrcode_triagem
      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('id, status_promessa, id_cooperativa, tipo_material')
        .eq('qrcode_triagem', qrData)
        .single();

      if (entregaError || !entrega) {
        console.error('[Triagem] Erro ao buscar entrega:', entregaError);
        toast.error("QR Code inválido", { 
          description: "Entrega não encontrada para este código de triagem" 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[Triagem] Entrega encontrada:', entrega);

      // Verificar se está em status correto
      if (entrega.status_promessa !== 'em_triagem') {
        toast.error("Status incorreto", { 
          description: `Esta entrega está ${entrega.status_promessa}, não em triagem` 
        });
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
        console.error('[Triagem] Erro ao buscar cooperativa:', coopError);
        toast.error("Cooperativa não encontrada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar se é a mesma cooperativa
      if (entrega.id_cooperativa !== coopData.id) {
        toast.error("Entrega de outra cooperativa", {
          description: "Esta entrega não pertence à sua cooperativa"
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Registrar início da triagem
      await supabase
        .from('entregas_reciclaveis')
        .update({ data_inicio_triagem: new Date().toISOString() })
        .eq('id', entrega.id);

      toast.success("Triagem iniciada!", { 
        description: `Material: ${entrega.tipo_material}` 
      });

      // Navegar para página de triagem
      navigate(`/cooperative/triagem/${entrega.id}`);

    } catch (error: any) {
      console.error("[Triagem] Erro ao processar triagem:", error);
      toast.error("Erro ao processar triagem", { 
        description: error.message 
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

  // Processar QR Code de entrega simples (UUID)
  const processEntregaSimples = async (qrcodeId: string) => {
    try {
      console.log('[QRCode] 🔍 Processando entrega simples (UUID)');
      console.log('[QRCode] UUID:', qrcodeId);

      // Buscar cooperativa do usuário
      console.log('[QRCode] Buscando cooperativa do usuário:', user?.id);
      const { data: coopData, error: coopError } = await supabase
        .from('cooperativas')
        .select('id')
        .eq('id_user', user?.id)
        .single();

      if (coopError || !coopData) {
        console.error('[QRCode] ❌ Erro ao buscar cooperativa:', coopError);
        toast.error("Cooperativa não encontrada");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] ✅ Cooperativa encontrada:', coopData.id);
      console.log('[QRCode] Buscando entrega pela coluna qrcode_id:', qrcodeId);
      
      // Buscar entrega pela coluna qrcode_id
      const { data: entrega, error: entregaError } = await supabase
        .from('entregas_reciclaveis')
        .select('*')
        .eq('qrcode_id', qrcodeId)
        .single();

      if (entregaError || !entrega) {
        console.error('[QRCode] ❌ Erro ao buscar entrega:', entregaError);
        toast.error("QR Code inválido", { 
          description: "Entrega não encontrada no sistema." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] ✅ Entrega encontrada:', entrega.id, 'Status:', entrega.status_promessa);

      // Verificar se a cooperativa da entrega é a mesma que está fazendo a coleta
      if (entrega.id_cooperativa !== coopData.id) {
        console.warn('[QRCode] ⚠️ Cooperativa diferente detectada');
        console.warn('[QRCode] Cooperativa do QR:', entrega.id_cooperativa);
        console.warn('[QRCode] Cooperativa atual:', coopData.id);
        toast.error("Entrega de outra cooperativa", { 
          description: "Esta entrega não pertence à sua cooperativa." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar se a entrega já foi coletada
      if (entrega.status_promessa === 'concluida') {
        console.warn('[QRCode] ⚠️ Entrega já foi coletada anteriormente');
        toast.error("Entrega já coletada", { 
          description: "Esta entrega já foi registrada como coletada." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      // Verificar se a entrega expirou (24 horas)
      const dataGeracao = new Date(entrega.data_geracao);
      const now = new Date();
      const hoursElapsed = differenceInHours(now, dataGeracao);
      
      if (hoursElapsed > 24) {
        console.warn('[QRCode] ⚠️ Entrega expirada');
        console.warn('[QRCode] Horas decorridas:', hoursElapsed);
        toast.error("QR Code expirado", { 
          description: "Esta entrega ultrapassou o prazo de 24 horas." 
        });
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] ✅ Entrega válida! Horas decorridas:', hoursElapsed);
      
      // Atualizar status para 'em_coleta'
      console.log('[QRCode] Atualizando status para em_coleta...');
      const { error: updateError } = await supabase
        .from('entregas_reciclaveis')
        .update({ 
          status_promessa: 'em_coleta'
        })
        .eq('id', entrega.id);

      if (updateError) {
        console.error('[QRCode] ❌ Erro ao atualizar status:', updateError);
        toast.error("Erro ao atualizar status");
        if (isMountedRef.current) setCameraStatus('idle');
        return;
      }

      console.log('[QRCode] ✅ Status atualizado com sucesso!');
      toast.success("Entrega validada!", { 
        description: "Aguarde, você será redirecionado..." 
      });

      // Aguardar 2 segundos antes de redirecionar
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate(`/cooperative/register-materials/${entrega.id}`);
        }
      }, 2000);

    } catch (error: any) {
      console.error("[QRCode] ❌ Erro fatal ao processar entrega simples:", error);
      console.error("[QRCode] Stack trace:", error.stack);
      toast.error("Erro ao processar", { 
        description: error.message || "Tente novamente" 
      });
      if (isMountedRef.current) setCameraStatus('idle');
    }
  };

  // Processar QR Code de entrega (JSON completo)
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
        
        // Tentar buscar só pelo ID para verificar inconsistência
        const { data: entregaDebug } = await supabase
          .from('entregas_reciclaveis')
          .select('id, hash_qrcode, id_cooperativa, status_promessa')
          .eq('id', data.id_entrega)
          .single();
        
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

  // Auto-iniciar scanner ao montar componente
  useEffect(() => {
    // Iniciar automaticamente após carregar os dados
    if (!loadingData) {
      handleStartScanning();
    }
  }, [loadingData]);

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

        {/* Card Principal - Scanner Universal */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <CardTitle>Scanner Universal de QR Code</CardTitle>
                <CardDescription>
                  Escaneie qualquer QR Code da Ciclik - o sistema detecta automaticamente o tipo
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informações das entregas e estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Entregas Diretas Esperando */}
              {!loadingData && entregasAtivas.length > 0 && (
                <Alert className="bg-primary/5">
                  <Package className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Entregas Diretas</span>
                      <Badge variant="secondary">{entregasAtivas.length}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Rotas Ativas */}
              {!loadingData && rotas.length > 0 && (
                <Alert className="bg-accent/5">
                  <Route className="h-4 w-4 text-accent" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rotas Ativas</span>
                      <Badge variant="secondary">{rotas.length}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Entregas em Triagem */}
              {!loadingData && entregasEmTriagem.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Scale className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Aguardando Triagem</span>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                        {entregasEmTriagem.length}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Informações sobre tipos de QR Code aceitos */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <p className="font-medium text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Tipos de QR Code Aceitos
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <span className="font-medium text-foreground">Entrega Direta:</span> Usuários que vêm entregar na cooperativa
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Route className="h-4 w-4 mt-0.5 text-accent" />
                  <div>
                    <span className="font-medium text-foreground">Coleta de Rota:</span> QR Code de adesão a rotas programadas
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Scale className="h-4 w-4 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-medium text-foreground">Triagem:</span> Validação de materiais na estação de triagem
                  </div>
                </div>
              </div>
            </div>

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
                    <li>✓ Detecta automaticamente o tipo de QR Code</li>
                    <li>✓ Verifica se pertence à sua cooperativa</li>
                    <li>✓ Valida prazo de validade (24h para entregas diretas)</li>
                    <li>✓ Confirma se ainda não foi usado</li>
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
                  <p className="font-medium text-lg">Solicitando permissão...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aguardando autorização para acessar a câmera
                  </p>
                </div>
              </div>
            )}

            {cameraStatus === 'granted' && (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
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
                    <strong>Permissão negada!</strong><br/>
                    Você precisa permitir o acesso à câmera nas configurações do navegador.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleStartScanning} variant="outline" className="w-full">
                  <Camera className="mr-2 h-5 w-5" />
                  Tentar Novamente
                </Button>
              </div>
            )}

            {cameraStatus === 'scanning' && (
              <div className="space-y-4">
                <Alert className="bg-primary/5">
                  <QrCode className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Aponte a câmera para qualquer QR Code Ciclik</strong><br/>
                    O sistema identificará automaticamente o tipo
                  </AlertDescription>
                </Alert>
                <Button onClick={stopScanner} variant="outline" className="w-full">
                  Parar Scanner
                </Button>
              </div>
            )}

            {cameraStatus === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <div>
                  <p className="font-medium text-lg">Processando QR Code...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Identificando tipo e validando informações...
                  </p>
                </div>
              </div>
            )}

            {cameraStatus === 'error' && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Seções expansíveis com detalhes */}
        {!loadingData && entregasAtivas.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Entregas Diretas Esperando ({entregasAtivas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {entregasAtivas.map((entrega) => (
                  <Alert key={entrega.id} className="bg-primary/5">
                    <User className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{entrega.usuario_nome || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entrega.data_geracao), { locale: ptBR, addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="secondary">{entrega.tipo_material || 'Diversos'}</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!loadingData && entregasEmTriagem.length > 0 && (
          <Card className="mt-4 border-l-4 border-l-amber-600">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-600" />
                Aguardando Triagem ({entregasEmTriagem.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {entregasEmTriagem.map((entrega) => (
                  <Alert key={entrega.id} className="bg-amber-50 border-amber-200">
                    <User className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{entrega.usuario_nome || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">
                            Enviado {formatDistanceToNow(new Date(entrega.data_envio_triagem), { locale: ptBR, addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                          {entrega.tipo_material || 'Diversos'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
