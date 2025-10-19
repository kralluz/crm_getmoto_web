/**
 * Hook para usar notificações
 * Facilita o uso do NotificationService em componentes React
 */

import { useCallback } from 'react';
import { NotificationService } from '../services';
import type { NotificationOptions, ToastOptions } from '../services/notification.service';

/**
 * Hook para notificações
 */
export function useNotification() {
  const toast = useCallback((options: ToastOptions) => {
    NotificationService.toast(options);
  }, []);

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

  const successToast = useCallback((message: string) => {
    NotificationService.successToast(message);
  }, []);

  const errorToast = useCallback((message: string) => {
    NotificationService.errorToast(message);
  }, []);

  const warningToast = useCallback((message: string) => {
    NotificationService.warningToast(message);
  }, []);

  const infoToast = useCallback((message: string) => {
    NotificationService.infoToast(message);
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

    // Toasts
    toast,
    successToast,
    errorToast,
    warningToast,
    infoToast,

    // Controles
    close,
    closeAll,
  };
}
