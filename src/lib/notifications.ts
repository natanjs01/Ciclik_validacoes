import { supabase } from '@/integrations/supabase/client';
import type { CreateNotificationParams, NotificationType } from '@/types/notifications';

/**
 * Helper para criar notificações via RPC function do Supabase
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: params.user_id,
      p_title: params.title,
      p_message: params.message,
      p_type: params.type || 'info',
      p_action_url: params.action_url || null,
      p_action_label: params.action_label || null,
      p_icon: params.icon || null,
      p_metadata: params.metadata || {},
    });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

/**
 * Helper para criar notificações em batch para múltiplos usuários
 */
export async function createBatchNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationParams, 'user_id'>
): Promise<void> {
  try {
    const promises = userIds.map(userId =>
      createNotification({ ...notification, user_id: userId })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao criar notificações em batch:', error);
  }
}

/**
 * Exemplos de notificações específicas do sistema
 */

// Notificação de nova coleta
export async function notifyNewColeta(
  userId: string,
  coletaId: string,
  peso: string
) {
  return createNotification({
    user_id: userId,
    title: 'Nova Coleta Registrada',
    message: `Uma nova coleta de ${peso}kg foi registrada com sucesso`,
    type: 'success',
    action_url: `/dashboard/coletas/${coletaId}`,
    action_label: 'Ver Detalhes',
    icon: 'Package',
    metadata: { coleta_id: coletaId, peso },
  });
}

// Notificação de mudança de status
export async function notifyStatusChange(
  userId: string,
  itemId: string,
  itemType: string,
  oldStatus: string,
  newStatus: string
) {
  return createNotification({
    user_id: userId,
    title: 'Status Atualizado',
    message: `O status de ${itemType} foi alterado de "${oldStatus}" para "${newStatus}"`,
    type: 'info',
    action_url: `/dashboard/${itemType}/${itemId}`,
    action_label: 'Ver Detalhes',
    icon: 'RefreshCw',
    metadata: { item_id: itemId, item_type: itemType, old_status: oldStatus, new_status: newStatus },
  });
}

// Notificação de bem-vindo
export async function notifyWelcome(userId: string, userName: string) {
  return createNotification({
    user_id: userId,
    title: `Bem-vindo ao Ciclik, ${userName}!`,
    message: 'Estamos felizes em ter você conosco. Explore o sistema e comece a fazer a diferença!',
    type: 'success',
    action_url: '/dashboard',
    action_label: 'Explorar',
    icon: 'Sparkles',
    metadata: { type: 'welcome' },
  });
}

// Notificação de conquista
export async function notifyAchievement(
  userId: string,
  achievementName: string,
  achievementDescription: string
) {
  return createNotification({
    user_id: userId,
    title: `🎉 Conquista Desbloqueada!`,
    message: `${achievementName}: ${achievementDescription}`,
    type: 'success',
    icon: 'Trophy',
    metadata: { type: 'achievement', achievement_name: achievementName },
  });
}

// Notificação de erro/alerta
export async function notifyError(
  userId: string,
  errorTitle: string,
  errorMessage: string
) {
  return createNotification({
    user_id: userId,
    title: errorTitle,
    message: errorMessage,
    type: 'error',
    icon: 'AlertCircle',
    metadata: { type: 'error' },
  });
}

// Notificação de sistema
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  return createNotification({
    user_id: userId,
    title,
    message,
    type: 'system',
    action_url: actionUrl,
    icon: 'Info',
    metadata: { type: 'system' },
  });
}
