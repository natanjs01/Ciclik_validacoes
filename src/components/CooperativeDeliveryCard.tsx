import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatWeight } from '@/lib/formatters';

interface DeliveryCardProps {
  entrega: {
    id: string;
    id_usuario: string;
    tipo_material: string;
    peso_estimado: number;
    status_promessa: string;
    data_geracao: string;
    profiles?: {
      nome: string;
      cpf: string;
    };
  };
  onScanQR: () => void;
}

export function CooperativeDeliveryCard({ entrega, onScanQR }: DeliveryCardProps) {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      'ativa': { variant: 'default', label: 'Aguardando' },
      'em_coleta': { variant: 'secondary', label: 'Em Coleta' },
      'finalizada': { variant: 'default', label: 'Finalizada' },
      'expirada': { variant: 'destructive', label: 'Expirada' }
    };
    
    const badgeInfo = badges[status] || { variant: 'outline', label: status };
    return <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>;
  };

  const getTimeRemaining = () => {
    const dataGeracao = new Date(entrega.data_geracao);
    const expiraEm = new Date(dataGeracao.getTime() + 24 * 60 * 60 * 1000);
    const agora = new Date();
    
    if (agora > expiraEm) {
      return 'Expirado';
    }
    
    return formatDistanceToNow(expiraEm, { locale: ptBR, addSuffix: true });
  };

  const isExpiring = () => {
    const dataGeracao = new Date(entrega.data_geracao);
    const expiraEm = new Date(dataGeracao.getTime() + 24 * 60 * 60 * 1000);
    const agora = new Date();
    const horasRestantes = (expiraEm.getTime() - agora.getTime()) / (1000 * 60 * 60);
    
    return horasRestantes <= 2 && horasRestantes > 0;
  };

  const getEntregadorInfo = () => {
    if (!entrega.profiles?.cpf || !entrega.profiles?.nome) {
      return 'Entregador não identificado';
    }
    
    // Pegar os 3 primeiros dígitos do CPF (removendo formatação)
    const cpfLimpo = entrega.profiles.cpf.replace(/\D/g, '');
    const tresPrimeirosCpf = cpfLimpo.substring(0, 3);
    
    // Pegar o primeiro nome
    const primeiroNome = entrega.profiles.nome.split(' ')[0];
    
    return `${tresPrimeirosCpf} - ${primeiroNome}`;
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${isExpiring() ? 'border-warning' : ''}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{getEntregadorInfo()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>{entrega.tipo_material}</span>
                <span>•</span>
                <span>{formatWeight(entrega.peso_estimado || 0)}</span>
              </div>
            </div>
            {getStatusBadge(entrega.status_promessa)}
          </div>

          {/* Tempo Restante */}
          <div className={`flex items-center gap-2 text-sm ${isExpiring() ? 'text-warning' : 'text-muted-foreground'}`}>
            <Clock className="h-4 w-4" />
            <span>{getTimeRemaining()}</span>
          </div>

          {/* ID */}
          <div className="bg-muted/50 p-2 rounded text-xs font-mono">
            ID: {entrega.id.substring(0, 8)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
