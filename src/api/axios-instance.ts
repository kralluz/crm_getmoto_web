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
 * Tratamento centralizado de erros com refresh token automático
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const apiError = ApiErrorHandler.handle(error);

    // Evitar retry em rotas de autenticação
    const isAuthRoute = originalRequest?.url?.includes('/auth/');
    
    // Tentativa de refresh token em caso de 401
    if (apiError.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Se já está refreshing, aguarda o novo token
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(axiosInstance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          // Chama endpoint de refresh
          const response = await axiosInstance.post('/api/auth/refresh', {
            refreshToken,
          });

          const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

          // Atualiza tokens no storage
          StorageService.setAuthToken(newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Atualiza header da requisição original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Notifica todas as requisições aguardando
          onTokenRefreshed(newAccessToken);
          isRefreshing = false;

          // Retenta a requisição original
          return axiosInstance(originalRequest);
        } else {
          // Sem refresh token, limpar tudo
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        // Se refresh falhar, limpa dados e redireciona para login
        isRefreshing = false;
        refreshSubscribers = [];

        apiLogger.warn('Token refresh failed - clearing auth data');
        StorageService.clearAuthData();
        localStorage.removeItem('refresh_token');
        requestQueue.clear();

        // Notifica subscribers com null para falhar as requisições pendentes
        onTokenRefreshed('');

        if (!window.location.pathname.includes('/login')) {
          apiLogger.info('Redirecting to login page');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Log estruturado do erro
    ApiErrorHandler.logError(apiError, {
      url: error.config?.url,
      method: error.config?.method,
    });

    // Exibe notificação visual do erro
    // Não mostra notificação para rotas de autenticação (tratado no componente)
    const isAuthRouteForNotification = originalRequest?.url?.includes('/auth/');
    if (!error.config?.skipErrorNotification && !isAuthRouteForNotification) {
      ApiErrorHandler.showNotification(apiError);
    }

    // Tratamento especial para 401 (não autorizado) sem refresh token ou em rotas de auth
    if (ApiErrorHandler.isCritical(apiError) && !error.config?._retry && (isAuthRouteForNotification || !localStorage.getItem('refresh_token'))) {
      apiLogger.warn('Unauthorized request - clearing auth data');
      StorageService.clearAuthData();
      localStorage.removeItem('refresh_token');
      requestQueue.clear();

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
