import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Package, ChevronRight, AlertTriangle, CheckCircle2, Truck } from "lucide-react";
import { formatDistanceToNow, differenceInHours, isWithinInterval, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { formatWeight } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";

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
              className={`relative overflow-hidden rounded-xl border ${timeInfo.urgent ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-card/50'}`}
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
    </div>
  );
};
