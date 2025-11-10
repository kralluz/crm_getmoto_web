import { type AxiosRequestConfig, type AxiosResponse } from 'axios';

interface QueueItem {
  config: AxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private concurrentLimit = 5; // Máximo de requisições simultâneas
  private activeRequests = 0;
  private retryAttempts = 3;
  private retryDelay = 1000; // ms

  constructor(concurrentLimit = 5) {
    this.concurrentLimit = concurrentLimit;
  }

  /**
   * Adiciona uma requisição à fila
   */
  enqueue(
    config: AxiosRequestConfig,
    executor: (config: AxiosRequestConfig) => Promise<AxiosResponse>
  ): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject });

      if (!this.processing) {
        this.processQueue(executor);
      }
    });
  }

  /**
   * Processa a fila de requisições
   */
  private async processQueue(
    executor: (config: AxiosRequestConfig) => Promise<AxiosResponse>
  ): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0 || this.activeRequests > 0) {
      if (this.activeRequests < this.concurrentLimit && this.queue.length > 0) {
        const item = this.queue.shift();

        if (item) {
          this.activeRequests++;
          this.executeRequest(item, executor);
        }
      } else {
        // Aguarda um pouco antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.processing = false;
  }

  /**
   * Executa uma requisição individual com retry
   */
  private async executeRequest(
    item: QueueItem,
    executor: (config: AxiosRequestConfig) => Promise<AxiosResponse>,
    attempt = 1
  ): Promise<void> {
    try {
      const response = await executor(item.config);
      item.resolve(response);
    } catch (error: any) {
      // NUNCA retentar erros de autenticação ou autorização
      if (this.isAuthError(error)) {
        item.reject(error);
        this.activeRequests--;
        return;
      }

      // NUNCA retentar erros do cliente (4xx exceto timeout)
      if (this.isClientError(error)) {
        item.reject(error);
        this.activeRequests--;
        return;
      }

      // Retry logic apenas para erros de rede ou 5xx
      const shouldRetry =
        attempt < this.retryAttempts &&
        (this.isNetworkError(error) || this.isServerError(error));

      if (shouldRetry) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeRequest(item, executor, attempt + 1);
      }

      item.reject(error);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Verifica se é um erro de autenticação/autorização (401, 403)
   */
  private isAuthError(error: any): boolean {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }

  /**
   * Verifica se é um erro do cliente (4xx)
   */
  private isClientError(error: any): boolean {
    const status = error.response?.status;
    return status && status >= 400 && status < 500;
  }

  /**
   * Verifica se é um erro de rede
   */
  private isNetworkError(error: any): boolean {
    return !error.response && error.code !== 'ECONNABORTED';
  }

  /**
   * Verifica se é um erro 5xx do servidor
   */
  private isServerError(error: any): boolean {
    return error.response && error.response.status >= 500;
  }

  /**
   * Limpa a fila (útil para logout ou navegação)
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled: Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Retorna o tamanho atual da fila
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Retorna o número de requisições ativas
   */
  get active(): number {
    return this.activeRequests;
  }
}

export const requestQueue = new RequestQueue(5);
