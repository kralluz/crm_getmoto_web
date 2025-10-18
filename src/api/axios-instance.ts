import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { requestQueue } from './request-queue';
import { ApiErrorHandler } from './error-handler';

// Configuração customizada da instância do Axios
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// INTERCEPTORS DE REQUEST
// ============================================================================

/**
 * Adiciona token de autenticação em todas as requisições
 * TEMPORARIAMENTE DESABILITADO PARA TESTES
 */
// axiosInstance.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = localStorage.getItem('auth_token');
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

/**
 * Adiciona timestamp para monitoramento de performance
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // @ts-ignore - Adiciona metadata customizada
    config.metadata = { startTime: new Date() };
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
  (response: AxiosResponse) => {
    // @ts-ignore
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = new Date().getTime() - startTime.getTime();
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
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
    // TEMPORARIAMENTE DESABILITADO PARA TESTES
    // if (ApiErrorHandler.isCritical(apiError)) {
    //   localStorage.removeItem('auth_token');

    //   // Limpa a fila de requisições
    //   requestQueue.clear();

    //   // Redireciona para login (somente se não estiver já na página de login)
    //   if (!window.location.pathname.includes('/login')) {
    //     window.location.href = '/login';
    //   }
    // }

    // Tratamento para 429 (Too Many Requests) - Rate Limiting
    if (apiError.status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      if (retryAfter) {
        console.warn(`[API] Rate limited. Retry after ${retryAfter}s`);
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
  config: AxiosRequestConfig
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

  // Adiciona método de cancelamento
  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled by user');
  };

  return promise as Promise<T>;
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Configurações opcionais para requisições individuais
 */
export interface RequestOptions {
  skipErrorNotification?: boolean; // Não exibe notificação de erro
  skipQueue?: boolean; // Bypassa a fila de requisições
}

/**
 * Wrapper para requisições que não devem entrar na fila
 */
export const directAxiosRequest = <T>(
  config: AxiosRequestConfig & RequestOptions
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
