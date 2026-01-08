import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationBellProps {
  showLabel?: boolean;
}

export default function NotificationBell({ showLabel = false }: NotificationBellProps) {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificacoes();
      
      // Configurar realtime para novas notificações
      const channel = supabase
        .channel('notificacoes-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `id_usuario=eq.${user.id}`
          },
          () => {
            loadNotificacoes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotificacoes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('id_usuario', user.id)
      .order('data_criacao', { ascending: false })
      .limit(10);

    if (data && !error) {
      setNotificacoes(data);
      setNaoLidas(data.filter(n => !n.lida).length);
    }
  };

  const marcarComoLida = async (id: string) => {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
    
    loadNotificacoes();
  };

  const marcarTodasComoLidas = async () => {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id_usuario', user?.id)
      .eq('lida', false);
    
    loadNotificacoes();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={showLabel ? "default" : "icon"} 
          className={`relative ${showLabel ? 'w-full justify-start gap-3 h-11' : ''}`}
        >
          <Bell className="h-5 w-5" />
          {showLabel && <span>Notificações</span>}
          {naoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className={`${showLabel ? 'ml-auto' : 'absolute -top-1 -right-1'} h-5 min-w-5 p-0 px-1 flex items-center justify-center text-xs`}
            >
              {naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={marcarTodasComoLidas}
              className="h-7 text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notificacoes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notificacoes.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`p-3 cursor-pointer ${!notif.lida ? 'bg-muted/50' : ''}`}
                onClick={() => !notif.lida && marcarComoLida(notif.id)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <p className="text-sm">{notif.mensagem}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notif.data_criacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
