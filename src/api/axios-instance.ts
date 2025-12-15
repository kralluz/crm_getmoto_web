import axios from 'axios';
import { requestQueue } from './request-queue';
import { ApiErrorHandler } from './error-handler';
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
// RETRY DISABLED - No retry logic applied
// ============================================================================

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

    // Evitar retry em rotas de autenticação e se já tentou
    const isAuthRoute = originalRequest?.url?.includes('/auth/');
    const hasRetried = originalRequest?._retry === true;
    
    // Tentativa de refresh token em caso de 401
    if (apiError.status === 401 && !hasRetried && !isAuthRoute) {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Se não tem refresh token, deslogar imediatamente
      if (!refreshToken) {
        apiLogger.warn('No refresh token available - clearing auth and redirecting');
        StorageService.clearAuthData();
        requestQueue.clear();
        
        try {
          const { useAuthStore } = await import('../store/auth-store');
          useAuthStore.getState().logout();
        } catch (err) {
          console.error('Error clearing auth store:', err);
        }

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(apiError);
      }

      // Se já está refreshing, aguarda o novo token
      if (isRefreshing) {
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

      // Marca que está fazendo refresh e a requisição já foi tentada
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        apiLogger.info('Attempting token refresh...');
        
        // Log para debug
        try {
          const { AuthDebug } = await import('../utils/auth-debug');
          AuthDebug.log('Starting token refresh', { hasRefreshToken: !!refreshToken });
        } catch (e) {
          // Ignora erro de import
        }
        
        // Chama endpoint de refresh sem interceptor para evitar loop
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
          throw new Error('No access token received from refresh');
        }

        apiLogger.info('Token refresh successful');

        // Atualiza tokens no storage
        StorageService.setAuthToken(newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        // Atualiza a store Zustand para manter sincronizado
        try {
          const { useAuthStore } = await import('../store/auth-store');
          const state = useAuthStore.getState();
          state.setToken(newAccessToken);
          if (newRefreshToken) {
            state.setRefreshToken(newRefreshToken);
          }
        } catch (storeError) {
          console.error('Error updating auth store:', storeError);
        }

        // Atualiza header da requisição original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Notifica todas as requisições aguardando
        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        // Retenta a requisição original
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Se refresh falhar, limpa dados e redireciona para login
        apiLogger.error('Token refresh failed:', refreshError);
        
        // Log para debug
        try {
          const { AuthDebug } = await import('../utils/auth-debug');
          AuthDebug.trackTokenRefresh(false, refreshError);
          AuthDebug.trackLogout('refresh-token-failed');
        } catch (e) {
          // Ignora erro de import
        }
        
        isRefreshing = false;
        refreshSubscribers = [];

        StorageService.clearAuthData();
        localStorage.removeItem('refresh_token');
        requestQueue.clear();

        // Limpar store Zustand
        try {
          const { useAuthStore } = await import('../store/auth-store');
          useAuthStore.getState().logout();
        } catch (err) {
          console.error('Error clearing auth store:', err);
        }

        // Notifica subscribers com empty para falhar as requisições pendentes
        onTokenRefreshed('');

        if (!window.location.pathname.includes('/login')) {
          apiLogger.info('Redirecting to login page after refresh failure');
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

    // Tratamento especial para 401 em rotas de auth ou sem refresh token
    if (apiError.status === 401 && (isAuthRouteForNotification || hasRetried)) {
      apiLogger.warn('Unauthorized request on auth route or after retry - clearing auth data');
      StorageService.clearAuthData();
      localStorage.removeItem('refresh_token');
      requestQueue.clear();

      try {
        const { useAuthStore } = await import('../store/auth-store');
        useAuthStore.getState().logout();
      } catch (err) {
        console.error('Error clearing auth store:', err);
      }

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
