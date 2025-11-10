/**
 * Interceptor de retry para requisições HTTP
 * Implementa exponential backoff e lógica de retry inteligente
 */

import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';
import { ApiErrorHandler } from './error-handler';
import { API_CONFIG } from '../constants';
import { apiLogger } from '../utils/logger';
import type { InternalAxiosRequestConfigWithMetadata } from './types';

/**
 * Configuração de retry
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: AxiosError) => boolean;
}

/**
 * Calcula o delay para o próximo retry usando exponential backoff
 */
function getRetryDelay(retryCount: number, baseDelay: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  const delay = baseDelay * Math.pow(2, retryCount);

  // Adiciona jitter (variação aleatória de ±20%) para evitar thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);

  return Math.min(delay + jitter, 30000); // Max 30 segundos
}

/**
 * Aguarda um período de tempo
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adiciona interceptor de retry ao Axios
 */
export function setupRetryInterceptor(
  axiosInstance: AxiosInstance,
  config: RetryConfig = {}
): void {
  const {
    maxRetries = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
    retryCondition,
  } = config;

  axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config =
      error.config as InternalAxiosRequestConfigWithMetadata;

    if (!config) {
      return Promise.reject(error);
    }

    // Inicializa contador de retry se não existir
    if (!config.metadata) {
      config.metadata = { startTime: new Date(), retryCount: 0 };
    }

    const retryCount = config.metadata.retryCount || 0;

    // Verifica se deve fazer retry
    const shouldRetry = retryCondition
      ? retryCondition(error)
      : defaultRetryCondition(error);

    if (!shouldRetry || retryCount >= maxRetries) {
      apiLogger.warn('Max retries reached or retry not applicable', {
        url: config.url,
        retryCount,
        maxRetries,
      });
      return Promise.reject(error);
    }

    // Incrementa contador
    config.metadata.retryCount = retryCount + 1;

    // Calcula delay
    const delay = getRetryDelay(retryCount, retryDelay);

    apiLogger.info(
      `Retrying request (attempt ${config.metadata.retryCount}/${maxRetries})`,
      {
        url: config.url,
        delay: `${Math.round(delay)}ms`,
        retryCount: config.metadata.retryCount,
      }
    );

    // Aguarda antes de retentar
    await sleep(delay);

    // Retorna promise de retry
    return axiosInstance(config);
  });
}

/**
 * Condição padrão para retry
 */
function defaultRetryCondition(error: AxiosError): boolean {
  // Não faz retry se não houver resposta (erro de rede)
  if (!error.response) {
    return true; // Retry em erros de rede
  }

  const status = error.response.status;

  // NUNCA retentar erros de autenticação/autorização
  if (status === 401 || status === 403) {
    return false;
  }

  // NUNCA retentar erros do cliente (4xx)
  if (status >= 400 && status < 500) {
    return false;
  }

  const apiError = ApiErrorHandler.handle(error);

  // Usa o método shouldRetry do ApiErrorHandler apenas para erros 5xx
  return ApiErrorHandler.shouldRetry(apiError);
}

/**
 * Remove interceptor de retry
 */
export function removeRetryInterceptor(
  axiosInstance: AxiosInstance,
  interceptorId: number
): void {
  axiosInstance.interceptors.response.eject(interceptorId);
}
