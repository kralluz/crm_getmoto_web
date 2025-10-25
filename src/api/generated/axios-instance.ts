import axios, { type AxiosRequestConfig } from 'axios';

// Configuração customizada da instância do Axios
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage?.getItem('auth_token') || import.meta.env.VITE_API_TOKEN;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erros de resposta da API
      console.error('API Error:', error.response.status, error.response.data);

      // Se for 401 (não autorizado), você pode fazer logout ou refresh do token aqui
      if (error.response.status === 401) {
        // Exemplo: window.location.href = '/login';
      }
    } else if (error.request) {
      // Erro de requisição (sem resposta)
      console.error('Network Error:', error.request);
    } else {
      // Outro tipo de erro
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Função customizada para ser usada pelo Orval
export const customAxiosInstance = <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = axiosInstance({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default axiosInstance;
