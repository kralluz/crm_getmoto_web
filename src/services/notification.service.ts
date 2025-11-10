import { App } from 'antd';
import { serviceLogger } from '../utils/logger';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  title?: string;
  message: string;
  description?: string;
  duration?: number;
  type?: NotificationType;
  key?: string;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// Armazena a instância do notification do contexto App
let notificationInstance: ReturnType<typeof App.useApp>['notification'] | null = null;

export const setNotificationInstance = (instance: ReturnType<typeof App.useApp>['notification']) => {
  notificationInstance = instance;
};

export class NotificationService {
  private static defaultDuration = 4.5;
  private static defaultPlacement: 'bottomRight' = 'bottomRight';

  static notify(options: NotificationOptions): void {
    const { 
      title, 
      message: msg, 
      description, 
      duration = this.defaultDuration, 
      type = 'info', 
      key,
      placement = this.defaultPlacement
    } = options;

    const config = {
      message: title || msg,
      description: description || (title ? msg : undefined),
      duration,
      key,
      placement,
    };

    if (!notificationInstance) {
      console.warn('Notification instance not initialized. Using console fallback.');
      console[type === 'error' ? 'error' : 'log'](`[${type}] ${config.message}`, config.description);
      return;
    }

    if (type === 'success') notificationInstance.success(config);
    else if (type === 'error') notificationInstance.error(config);
    else if (type === 'warning') notificationInstance.warning(config);
    else notificationInstance.info(config);

    serviceLogger.debug('Notification displayed', { type, message: msg, placement });
  }

  static success(msg: string, desc?: string): void {
    this.notify({ message: msg, description: desc, type: 'success' });
  }

  static error(msg: string, desc?: string): void {
    this.notify({ message: msg, description: desc, type: 'error' });
  }

  static warning(msg: string, desc?: string): void {
    this.notify({ message: msg, description: desc, type: 'warning' });
  }

  static info(msg: string, desc?: string): void {
    this.notify({ message: msg, description: desc, type: 'info' });
  }

  static close(key: string): void {
    notificationInstance?.destroy(key);
  }

  static closeAll(): void {
    notificationInstance?.destroy();
  }
}
