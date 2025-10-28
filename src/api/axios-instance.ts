import axios from 'axios';
import { requestQueue } from './request-queue';
import { ApiErrorHandler } from './error-handler';
import { setupRetryInterceptor } from './retry-interceptor';
import { API_CONFIG } from '../constants';
import { StorageService } from '../services';
import { apiLogger } from '../utils/logger';
import type {
  AxiosRequestConfigWithMetadata,
  InternalAxiosRequestConfigWithMetadata,
  AxiosResponseWithMetadata,
  RequestOptions,
} from './types';

// Configuração customizada da instância do Axios
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// RETRY INTERCEPTOR
// ============================================================================

/**
 * Configura retry automático com exponential backoff
 */
setupRetryInterceptor(axiosInstance, {
  maxRetries: API_CONFIG.RETRY_ATTEMPTS,
  retryDelay: API_CONFIG.RETRY_DELAY,
});

// ============================================================================
// INTERCEPTORS DE REQUEST
// ============================================================================

/**
 * Adiciona token de autenticação em todas as requisições
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfigWithMetadata) => {
    const token = StorageService.getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    apiLogger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

/**
 * Adiciona timestamp para monitoramento de performance
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfigWithMetadata) => {
    // Adiciona metadata customizada com tipagem correta
    config.metadata = {
      startTime: new Date(),
      retryCount: 0,
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERCEPTORS DE RESPONSE
// ============================================================================

/**
 * Calcula tempo de resposta para monitoramento
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponseWithMetadata) => {
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = new Date().getTime() - startTime.getTime();
      apiLogger.debug(
        `${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`
      );
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Tratamento centralizado de erros
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = ApiErrorHandler.handle(error);

    // Log estruturado do erro
    ApiErrorHandler.logError(apiError, {
      url: error.config?.url,
      method: error.config?.method,
    });

    // Exibe notificação visual do erro
    if (!error.config?.skipErrorNotification) {
      ApiErrorHandler.showNotification(apiError);
    }

    // Tratamento especial para 401 (não autorizado)
    // Não redireciona se skipErrorNotification estiver ativo
    if (ApiErrorHandler.isCritical(apiError) && !error.config?.skipErrorNotification) {
      apiLogger.warn('Unauthorized request - clearing auth data');
      StorageService.clearAuthData();

      // Limpa a fila de requisições
      requestQueue.clear();

      // Redireciona para login (somente se não estiver já na página de login)
      if (!window.location.pathname.includes('/login')) {
        apiLogger.info('Redirecting to login page');
        window.location.href = '/login';
      }
    }

    // Tratamento para 429 (Too Many Requests) - Rate Limiting
    if (apiError.status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      if (retryAfter) {
        apiLogger.warn(`Rate limited. Retry after ${retryAfter}s`);
      }
    }

    return Promise.reject(apiError);
  }
);

// ============================================================================
// FUNÇÃO CUSTOMIZADA PARA O ORVAL
// ============================================================================

/**
 * Wrapper customizado que integra com a fila de requisições
 * Esta função é usada pelo Orval para todas as chamadas de API
 */
export const customAxiosInstance = <T>(
  config: AxiosRequestConfigWithMetadata
): Promise<T> => {
  const source = axios.CancelToken.source();

  // Adiciona a requisição à fila
  const promise = requestQueue
    .enqueue(
      {
        ...config,
        cancelToken: source.token,
      },
      (queuedConfig) => axiosInstance(queuedConfig)
    )
    .then(({ data }) => data);

  // Retorna promise com método de cancelamento
  return Object.assign(promise, {
    cancel: () => {
      source.cancel('Query was cancelled by user');
    },
  });
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Wrapper para requisições que não devem entrar na fila
 */
export const directAxiosRequest = <T>(
  config: AxiosRequestConfigWithMetadata & RequestOptions
): Promise<T> => {
  return axiosInstance(config).then(({ data }) => data);
};

/**
 * Retorna informações sobre a fila de requisições
 */
export const getQueueInfo = () => ({
  queueSize: requestQueue.size,
  activeRequests: requestQueue.active,
});

/**
 * Limpa a fila de requisições (útil para logout)
 */
export const clearRequestQueue = () => {
  requestQueue.clear();
};

export default axiosInstance;
