import { AxiosError } from 'axios';
import { message as antdMessage } from 'antd';

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
        code: 'GENERIC_ERROR',
        timestamp,
      };
    }

    // Erro desconhecido
    return {
      message: 'Ocorreu um erro desconhecido',
      code: 'UNKNOWN_ERROR',
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
        message: 'Erro de conexão. Verifique sua internet.',
        code: 'NETWORK_ERROR',
        timestamp,
      };
    }

    // Erro na configuração da requisição
    return {
      message: message || 'Erro ao configurar a requisição',
      code: 'REQUEST_CONFIG_ERROR',
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

    // Mensagens padrão por status
    const statusMessages: Record<number, string> = {
      400: 'Requisição inválida',
      401: 'Não autorizado. Faça login novamente.',
      403: 'Acesso negado',
      404: 'Recurso não encontrado',
      409: 'Conflito de dados',
      422: 'Dados inválidos',
      429: 'Muitas requisições. Tente novamente mais tarde.',
      500: 'Erro interno do servidor',
      502: 'Serviço temporariamente indisponível',
      503: 'Serviço temporariamente indisponível',
      504: 'Tempo de resposta esgotado',
    };

    return statusMessages[status] || `Erro ${status}`;
  }

  /**
   * Obtém código de erro baseado no status HTTP
   */
  private static getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return codes[status] || `HTTP_${status}`;
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

    // Retry apenas em erros 5xx e alguns 4xx
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Verifica se o erro é crítico (deve fazer logout)
   */
  static isCritical(error: ApiError): boolean {
    return error.status === 401 || error.code === 'UNAUTHORIZED';
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

    // Em produção, envie para serviço de logs (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      console.error('[API Error]', errorLog);
      // TODO: Integrar com serviço de logs
      // Sentry.captureException(error, { extra: errorLog });
    } else {
      console.error('[API Error]', errorLog);
    }
  }
}
