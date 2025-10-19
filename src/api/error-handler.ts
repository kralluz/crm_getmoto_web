import { AxiosError } from 'axios';
import { message as antdMessage } from 'antd';
import i18n from '../i18n/config';
import { HTTP_STATUS, ERROR_CODES, RETRYABLE_STATUS_CODES } from '../constants';
import { apiLogger } from '../utils/logger';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: Date;
}

export class ApiErrorHandler {
  /**
   * Trata erros da API e retorna um objeto padronizado
   */
  static handle(error: unknown): ApiError {
    const timestamp = new Date();

    // Erro do Axios (erro HTTP)
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, timestamp);
    }

    // Erro genérico
    if (error instanceof Error) {
      return {
        message: error.message,
        code: ERROR_CODES.GENERIC_ERROR,
        timestamp,
      };
    }

    // Erro desconhecido
    return {
      message: i18n.t('errors.types.unknown'),
      code: ERROR_CODES.UNKNOWN_ERROR,
      timestamp,
    };
  }

  /**
   * Trata erros do Axios
   */
  private static handleAxiosError(error: AxiosError, timestamp: Date): ApiError {
    const { response, request, message } = error;

    // Erro com resposta do servidor
    if (response) {
      const { status, data } = response;

      return {
        message: this.getErrorMessage(status, data),
        status,
        code: this.getErrorCode(status),
        details: data,
        timestamp,
      };
    }

    // Erro de rede (sem resposta)
    if (request) {
      return {
        message: i18n.t('errors.types.network'),
        code: ERROR_CODES.NETWORK_ERROR,
        timestamp,
      };
    }

    // Erro na configuração da requisição
    return {
      message: message || i18n.t('errors.types.requestConfig'),
      code: ERROR_CODES.REQUEST_CONFIG_ERROR,
      timestamp,
    };
  }

  /**
   * Obtém mensagem de erro baseada no status HTTP
   */
  private static getErrorMessage(status: number, data: any): string {
    // Tenta extrair mensagem do body da resposta
    const bodyMessage = data?.message || data?.error || data?.msg;
    if (bodyMessage) {
      return bodyMessage;
    }

    // Mensagens i18n padrão por status
    const statusKey = status.toString();
    const hasTranslation = i18n.exists(`errors.http.${statusKey}`);

    if (hasTranslation) {
      return i18n.t(`errors.http.${statusKey}`);
    }

    // Fallback para mensagem genérica
    return i18n.t('errors.http.unknown', { status });
  }

  /**
   * Obtém código de erro baseado no status HTTP
   */
  private static getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      [HTTP_STATUS.BAD_REQUEST]: ERROR_CODES.BAD_REQUEST,
      [HTTP_STATUS.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
      [HTTP_STATUS.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
      [HTTP_STATUS.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
      [HTTP_STATUS.CONFLICT]: ERROR_CODES.CONFLICT,
      [HTTP_STATUS.UNPROCESSABLE_ENTITY]: ERROR_CODES.UNPROCESSABLE_ENTITY,
      [HTTP_STATUS.TOO_MANY_REQUESTS]: ERROR_CODES.TOO_MANY_REQUESTS,
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ERROR_CODES.INTERNAL_SERVER_ERROR,
      [HTTP_STATUS.BAD_GATEWAY]: ERROR_CODES.BAD_GATEWAY,
      [HTTP_STATUS.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVICE_UNAVAILABLE,
      [HTTP_STATUS.GATEWAY_TIMEOUT]: ERROR_CODES.GATEWAY_TIMEOUT,
    };

    return codeMap[status] || `HTTP_${status}`;
  }

  /**
   * Verifica se o erro é do tipo AxiosError
   */
  private static isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  /**
   * Exibe notificação de erro usando Ant Design
   */
  static showNotification(error: ApiError, duration = 5): void {
    antdMessage.error({
      content: error.message,
      duration,
      key: error.code, // Evita duplicar mensagens com o mesmo código
    });
  }

  /**
   * Verifica se o erro deve ser retentado
   */
  static shouldRetry(error: ApiError): boolean {
    if (!error.status) return true; // Erros de rede podem ser retentados

    // Usa constantes para status retentáveis
    return RETRYABLE_STATUS_CODES.includes(error.status as any);
  }

  /**
   * Verifica se o erro é crítico (deve fazer logout)
   */
  static isCritical(error: ApiError): boolean {
    return (
      error.status === HTTP_STATUS.UNAUTHORIZED ||
      error.code === ERROR_CODES.UNAUTHORIZED
    );
  }

  /**
   * Log estruturado de erros (para enviar ao backend ou serviço de logs)
   */
  static logError(error: ApiError, context?: Record<string, any>): void {
    const errorLog = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Usa o logger profissional
    apiLogger.error('API Error', error as any, errorLog);

    // TODO: Integrar com serviço de logs (Sentry, LogRocket, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorLog });
    // }
  }
}
