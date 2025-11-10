/**
 * Hook para usar notificações
 * Facilita o uso do NotificationService em componentes React
 */

import { useCallback } from 'react';
import { NotificationService } from '../services';
import type { NotificationOptions } from '../services/notification.service';

/**
 * Hook para notificações
 */
export function useNotification() {
  const notify = useCallback((options: NotificationOptions) => {
    NotificationService.notify(options);
  }, []);

  const success = useCallback((message: string, description?: string) => {
    NotificationService.success(message, description);
  }, []);

  const error = useCallback((message: string, description?: string) => {
    NotificationService.error(message, description);
  }, []);

  const warning = useCallback((message: string, description?: string) => {
    NotificationService.warning(message, description);
  }, []);

  const info = useCallback((message: string, description?: string) => {
    NotificationService.info(message, description);
  }, []);

  const close = useCallback((key: string) => {
    NotificationService.close(key);
  }, []);

  const closeAll = useCallback(() => {
    NotificationService.closeAll();
  }, []);

  return {
    // Notificações completas
    notify,
    success,
    error,
    warning,
    info,

    // Controles
    close,
    closeAll,
  };
}
