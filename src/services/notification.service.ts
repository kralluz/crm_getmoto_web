import { message, notification } from 'antd';
import { serviceLogger } from '../utils/logger';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  title?: string;
  message: string;
  description?: string;
  duration?: number;
  type?: NotificationType;
  key?: string;
}

export interface ToastOptions {
  message: string;
  duration?: number;
  type?: NotificationType;
  key?: string;
}

export class NotificationService {
  private static defaultDuration = 3;

  static toast(options: ToastOptions): void {
    const { message: msg, duration = this.defaultDuration, type = 'info', key } = options;
    const config = { content: msg, duration, key };

    if (type === 'success') message.success(config);
    else if (type === 'error') message.error(config);
    else if (type === 'warning') message.warning(config);
    else message.info(config);

    serviceLogger.debug('Toast displayed', { type, message: msg });
  }

  static notify(options: NotificationOptions): void {
    const { title, message: msg, description, duration = 4.5, type = 'info', key } = options;

    const config = {
      message: title || msg,
      description: description || (title ? msg : undefined),
      duration,
      key,
    };

    if (type === 'success') notification.success(config);
    else if (type === 'error') notification.error(config);
    else if (type === 'warning') notification.warning(config);
    else notification.info(config);

    serviceLogger.debug('Notification displayed', { type, message: msg });
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

  static successToast(msg: string): void {
    this.toast({ message: msg, type: 'success' });
  }

  static errorToast(msg: string): void {
    this.toast({ message: msg, type: 'error' });
  }

  static warningToast(msg: string): void {
    this.toast({ message: msg, type: 'warning' });
  }

  static infoToast(msg: string): void {
    this.toast({ message: msg, type: 'info' });
  }

  static close(key: string): void {
    notification.destroy(key);
    message.destroy(key);
  }

  static closeAll(): void {
    notification.destroy();
    message.destroy();
  }
}
