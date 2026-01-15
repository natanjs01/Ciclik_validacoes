import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Notification,
  NotificationPreferences,
  NotificationContextType,
} from '@/types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Buscar notificações do usuário
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limitar a 50 notificações mais recentes

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Buscar preferências do usuário
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Se não existir preferências, criar com valores padrão
      if (!data) {
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    }
  }, [user]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_id: notificationId
      });

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        target_user_id: user.id
      });

      if (error) throw error;

      // Atualizar estado local
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: now }))
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [user]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  // Atualizar preferências
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(newPreferences)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
    }
  }, [user]);

  // Solicitar permissão para push notifications
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Este navegador não suporta Service Workers');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Registrar push subscription
        const registration = await navigator.serviceWorker.ready;
        
        // VAPID public key - você precisará gerar isso
        // const vapidPublicKey = 'SUA_VAPID_PUBLIC_KEY_AQUI';
        // const subscription = await registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: vapidPublicKey
        // });

        // Por enquanto, apenas habilitar push notifications nas preferências
        await updatePreferences({ enable_push: true });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão de push:', error);
      return false;
    }
  }, [updatePreferences]);

  // Refresh manual de notificações
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Setup realtime subscription para novas notificações
  useEffect(() => {
    if (!user) return;

    // Buscar dados iniciais
    fetchNotifications();
    fetchPreferences();

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // console.log('Notificação recebida:', payload); // Debug real-time notifications

          if (payload.eventType === 'INSERT') {
            // Nova notificação
            setNotifications(prev => [payload.new as Notification, ...prev]);
            
            // Mostrar notificação do navegador se permitido
            if (preferences?.enable_push && 'Notification' in window && Notification.permission === 'granted') {
              const notification = payload.new as Notification;
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192-white.png',
                badge: '/icon-192-white.png',
                tag: notification.id,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Atualização de notificação
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new as Notification : n))
            );
          } else if (payload.eventType === 'DELETE') {
            // Deleção de notificação
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, fetchPreferences, preferences?.enable_push]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestPushPermission,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}
