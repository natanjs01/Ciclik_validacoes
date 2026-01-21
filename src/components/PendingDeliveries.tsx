import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Package, ChevronRight, AlertTriangle, CheckCircle2, Truck, QrCode, Download, Printer } from "lucide-react";
import { formatDistanceToNow, differenceInHours, isWithinInterval, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { formatWeight } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateQRCodeWithLogo } from "@/utils/qrCodeWithLogo";

interface PendingDelivery {
  id: string;
  qrcode_id: string;
  data_geracao: string;
  peso_estimado: number;
  status: string;
  status_promessa: string;
  cooperativa: {
    nome_fantasia: string;
  };
  itens_vinculados: string[];
}

export const PendingDeliveries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<PendingDelivery | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadPendingDeliveries();
      
      const interval = setInterval(loadPendingDeliveries, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPendingDeliveries = async () => {
    try {
      // Filtrar apenas entregas das últimas 24 horas
      const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();
      
      const { data, error } = await supabase
        .from('entregas_reciclaveis')
        .select(`
          id,
          qrcode_id,
          data_geracao,
          peso_estimado,
          status,
          status_promessa,
          itens_vinculados,
          cooperativas!inner(nome_fantasia)
        `)
        .eq('id_usuario', user?.id)
        .eq('status_promessa', 'ativa') // Apenas promessas ativas (removido 'em_coleta' que não existe no enum)
        .gte('data_geracao', twentyFourHoursAgo)
        .order('data_geracao', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(d => ({
        ...d,
        cooperativa: Array.isArray(d.cooperativas) ? d.cooperativas[0] : d.cooperativas
      })) || [];

      setDeliveries(formatted);
    } catch (error: any) {
      console.error('Erro ao carregar entregas pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeInfo = (dataGeracao: string) => {
    const created = new Date(dataGeracao);
    const now = new Date();
    const hoursElapsed = differenceInHours(now, created);
    const hoursRemaining = 24 - hoursElapsed;

    if (hoursRemaining <= 0) {
      return { 
        text: 'Expirado', 
        color: 'bg-destructive/10 text-destructive border-destructive/20', 
        progress: 100,
        urgent: true 
      };
    } else if (hoursRemaining <= 3) {
      return { 
        text: `${hoursRemaining}h`, 
        color: 'bg-destructive/10 text-destructive border-destructive/20',
        progress: Math.min(100, ((24 - hoursRemaining) / 24) * 100),
        urgent: true 
      };
    } else if (hoursRemaining <= 6) {
      return { 
        text: `${hoursRemaining}h`, 
        color: 'bg-warning/10 text-warning border-warning/20',
        progress: ((24 - hoursRemaining) / 24) * 100,
        urgent: false 
      };
    } else {
      return { 
        text: `${hoursRemaining}h`, 
        color: 'bg-primary/10 text-primary border-primary/20',
        progress: ((24 - hoursRemaining) / 24) * 100,
        urgent: false 
      };
    }
  };

  const getStatusInfo = (status_promessa: string) => {
    switch (status_promessa) {
      case 'em_coleta':
        return { 
          icon: Truck, 
          text: 'Em coleta', 
          color: 'bg-blue-500/10 text-blue-600' 
        };
      case 'ativa':
      default:
        return { 
          icon: Clock, 
          text: 'Aguardando', 
          color: 'bg-amber-500/10 text-amber-600' 
        };
    }
  };

  const handleCardClick = async (delivery: PendingDelivery) => {
    const timeInfo = getTimeInfo(delivery.data_geracao);
    
    // Só abre o modal se não estiver expirado
    if (timeInfo.text !== 'Expirado') {
      setSelectedDelivery(delivery);
      setShowQRModal(true);
      
      // Gerar QR Code com logo
      try {
        const qrWithLogo = await generateQRCodeWithLogo({
          data: delivery.qrcode_id,
          width: 400,
          margin: 2
        });
        setQrCodeDataUrl(qrWithLogo);
      } catch (error) {
        console.error('Erro ao gerar QR Code com logo:', error);
        toast.error('Erro ao gerar QR Code');
      }
    } else {
      toast.error('Esta entrega expirou', {
        description: 'O prazo de 24 horas já passou.'
      });
    }
  };

  const handleDownloadQR = () => {
    if (!selectedDelivery || !qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-entrega-${selectedDelivery.qrcode_id}.png`;
    link.click();
    toast.success('QR Code baixado com sucesso!');
  };

  const handlePrintQR = () => {
    if (!selectedDelivery || !qrCodeDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Entrega ${selectedDelivery.qrcode_id}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
              color: #333;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 32px;
            }
            .qrcode {
              margin: 20px 0;
            }
            .qrcode img {
              max-width: 400px;
              height: auto;
            }
            .footer {
              margin-top: 32px;
              font-size: 14px;
              color: #888;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌱 Ciclik - Entrega de Recicláveis</h1>
            <div class="subtitle">
              <strong>${selectedDelivery.cooperativa.nome_fantasia}</strong><br>
              ${formatWeight(selectedDelivery.peso_estimado || 0)}
            </div>
            <div class="qrcode">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
            <div class="footer">
              Código: ${selectedDelivery.qrcode_id}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 100);
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Nenhuma entrega pendente nas últimas 24h
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header informativo */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {deliveries.length} {deliveries.length === 1 ? 'entrega pendente' : 'entregas pendentes'}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Últimas 24h</span>
      </div>

      {/* Lista de entregas */}
      <AnimatePresence>
        {deliveries.slice(0, 3).map((delivery, index) => {
          const timeInfo = getTimeInfo(delivery.data_geracao);
          const statusInfo = getStatusInfo(delivery.status_promessa);
          const StatusIcon = statusInfo.icon;
          const itemCount = delivery.itens_vinculados?.length || 0;

          return (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                timeInfo.urgent ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50' : 'border-border/50 bg-card/50 hover:border-primary/30'
              }`}
              onClick={() => handleCardClick(delivery)}
            >
              {/* Progress bar no topo */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30">
                <motion.div 
                  className={`h-full ${timeInfo.urgent ? 'bg-destructive' : 'bg-primary'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${timeInfo.progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>

              <div className="p-3 pt-3.5">
                <div className="flex items-center justify-between gap-3">
                  {/* Info principal */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Ícone de status */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${statusInfo.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>

                    {/* Detalhes */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {delivery.cooperativa.nome_fantasia}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatWeight(delivery.peso_estimado || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de tempo */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-semibold px-2 py-0.5 ${timeInfo.color}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {timeInfo.text}
                    </Badge>
                  </div>
                </div>

                {/* Alerta urgente */}
                {timeInfo.urgent && timeInfo.text !== 'Expirado' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 mt-2 pt-2 border-t border-destructive/20"
                  >
                    <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                    <span className="text-[10px] text-destructive">
                      Entregue em breve para não perder os pontos!
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Mostrar mais se houver */}
      {deliveries.length > 3 && (
        <p className="text-[11px] text-center text-muted-foreground">
          +{deliveries.length - 3} {deliveries.length - 3 === 1 ? 'entrega' : 'entregas'} nas últimas 24h
        </p>
      )}

      {/* Link para histórico */}
      <Button 
        variant="ghost" 
        size="sm"
        className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/delivery-history')}
      >
        Ver histórico completo
        <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>

      {/* Modal do QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code da Entrega
            </DialogTitle>
            <DialogDescription>
              {selectedDelivery && (
                <>
                  Entrega para <strong>{selectedDelivery.cooperativa.nome_fantasia}</strong>
                  <br />
                  {formatWeight(selectedDelivery.peso_estimado || 0)} estimado
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4">
              {/* QR Code com Logo */}
              <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code da Entrega"
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
                <p className="text-xs text-muted-foreground mb-1">Código da Entrega:</p>
                <p className="font-mono text-sm font-medium break-all">{selectedDelivery.qrcode_id}</p>
              </div>

              {/* Tempo restante */}
              {(() => {
                const timeInfo = getTimeInfo(selectedDelivery.data_geracao);
                return timeInfo.text !== 'Expirado' && (
                  <div className={`p-3 rounded-md border ${timeInfo.color}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {timeInfo.text} restantes para entrega
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadQR}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePrintQR}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              <Button 
                className="w-full"
                onClick={() => setShowQRModal(false)}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
