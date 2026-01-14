import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Trash2, Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestPushPermission,
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleTogglePush = async () => {
    if (!preferences?.enable_push) {
      const granted = await requestPushPermission();
      if (!granted) {
        toast.error('Permissão de notificação negada');
      } else {
        toast.success('Notificações push ativadas!');
      }
    } else {
      await updatePreferences({ enable_push: false });
      toast.info('Notificações push desativadas');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Força scroll para esconder barra do navegador
            window.scrollTo(0, 1);
            setTimeout(() => window.scrollTo(0, 0), 10);
            navigate(-1);
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie suas notificações e preferências
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Todas as notificações */}
        <TabsContent value="all" className="space-y-4">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            </div>
          )}

          {loading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center text-muted-foreground">
                Carregando notificações...
              </div>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <Bell className="h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Nenhuma notificação</p>
                <p className="text-sm">Você está em dia! 🎉</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:shadow-md',
                    !notification.read && 'border-l-4 border-l-blue-600 bg-accent/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-3xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn(
                          'font-medium',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                        {notification.action_label && (
                          <span className="text-sm font-medium text-primary">
                            {notification.action_label} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Não lidas */}
        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <Check className="h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Tudo lido!</p>
                <p className="text-sm">Você não tem notificações pendentes</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {unreadNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="p-4 cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-600 bg-accent/50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 text-3xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Canais de Notificação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha como você deseja receber notificações
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="in-app">Notificações no App</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações dentro da aplicação
                    </p>
                  </div>
                  <Switch
                    id="in-app"
                    checked={preferences?.enable_in_app ?? true}
                    onCheckedChange={(checked) => 
                      updatePreferences({ enable_in_app: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações mesmo quando não estiver usando o app
                    </p>
                  </div>
                  <Switch
                    id="push"
                    checked={preferences?.enable_push ?? false}
                    onCheckedChange={handleTogglePush}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Tipos de Notificação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha quais notificações você deseja receber
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-coleta">Novas Coletas</Label>
                  <Switch
                    id="new-coleta"
                    checked={preferences?.notify_new_coleta ?? true}
                    onCheckedChange={(checked) =>
                      updatePreferences({ notify_new_coleta: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="status-change">Mudanças de Status</Label>
                  <Switch
                    id="status-change"
                    checked={preferences?.notify_status_change ?? true}
                    onCheckedChange={(checked) =>
                      updatePreferences({ notify_status_change: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="messages">Novas Mensagens</Label>
                  <Switch
                    id="messages"
                    checked={preferences?.notify_new_message ?? true}
                    onCheckedChange={(checked) =>
                      updatePreferences({ notify_new_message: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="system">Atualizações do Sistema</Label>
                  <Switch
                    id="system"
                    checked={preferences?.notify_system_updates ?? true}
                    onCheckedChange={(checked) =>
                      updatePreferences({ notify_system_updates: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="achievements">Conquistas e Marcos</Label>
                  <Switch
                    id="achievements"
                    checked={preferences?.notify_achievements ?? true}
                    onCheckedChange={(checked) =>
                      updatePreferences({ notify_achievements: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
