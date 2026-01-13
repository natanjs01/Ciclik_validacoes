// =============================================
// TIPOS PARA SISTEMA DE NOTIFICAÇÕES
// =============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string | null;
  action_label?: string | null;
  icon?: string | null;
  metadata?: Record<string, any>;
  read: boolean;
  read_at?: string | null;
  scheduled_for?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  enable_in_app: boolean;
  enable_push: boolean;
  enable_email: boolean;
  notify_new_coleta: boolean;
  notify_status_change: boolean;
  notify_new_message: boolean;
  notify_system_updates: boolean;
  notify_achievements: boolean;
  push_subscription?: PushSubscriptionJSON | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  action_url?: string;
  action_label?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

// Tipos para Push Notifications
export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
