/**
 * Serviço de logging profissional
 * Suporta múltiplos níveis de log e integração com serviços externos (Sentry, LogRocket)
 */

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isProduction = import.meta.env.PROD;
  private minLevel: LogLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;

  /**
   * Define o nível mínimo de log
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Log de debug (desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log de warning
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context);

    // Console log
    this.logToConsole(entry);

    // Enviar para serviços externos em produção
    if (this.isProduction && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      this.logToExternalService(entry);
    }
  }

  /**
   * Cria entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: context?.error,
    };
  }

  /**
   * Verifica se deve fazer log baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log no console com formatação
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, timestamp } = entry;
    const timeStr = timestamp.toISOString();
    const prefix = `[${timeStr}] [${level.toUpperCase()}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, context);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, context);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, context);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, context);
        if (entry.error) {
          console.error('Error details:', entry.error);
        }
        break;
    }
  }

  /**
   * Envia log para serviço externo (Sentry, LogRocket, etc.)
   */
  private logToExternalService(entry: LogEntry): void {
    // TODO: Integrar com Sentry
    // if (window.Sentry) {
    //   if (entry.level === LogLevel.ERROR && entry.error) {
    //     window.Sentry.captureException(entry.error, {
    //       extra: {
    //         message: entry.message,
    //         context: entry.context,
    //         timestamp: entry.timestamp,
    //       },
    //     });
    //   } else {
    //     window.Sentry.captureMessage(entry.message, {
    //       level: entry.level,
    //       extra: entry.context,
    //     });
    //   }
    // }

    // TODO: Integrar com LogRocket
    // if (window.LogRocket) {
    //   window.LogRocket.log(entry.message, entry.context);
    // }

    // Por enquanto, apenas armazena no console em produção
    if (this.isProduction) {
      // Pode enviar para endpoint de logs customizado
      this.sendToBackend(entry);
    }
  }

  /**
   * Envia log para backend (opcional)
   */
  private async sendToBackend(_entry: LogEntry): Promise<void> {
    try {
      // TODO: Implementar endpoint de logs no backend
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_entry),
      // });
    } catch (error) {
      // Não faz nada se falhar para evitar loop infinito
      console.error('Failed to send log to backend:', error);
    }
  }

  /**
   * Cria um logger com contexto pré-definido
   */
  createContextLogger(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        this.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...baseContext, ...context }),
      error: (message: string, error?: Error, context?: LogContext) =>
        this.error(message, error, { ...baseContext, ...context }),
    };
  }
}

// Singleton
export const logger = new Logger();

// Logger específico para API
export const apiLogger = logger.createContextLogger({ module: 'API' });

// Logger específico para componentes
export const componentLogger = logger.createContextLogger({ module: 'Component' });

// Logger específico para serviços
export const serviceLogger = logger.createContextLogger({ module: 'Service' });
