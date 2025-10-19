/**
 * Tipos customizados para a camada de API
 */

import type {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

/**
 * Metadata customizada para requisições
 */
export interface RequestMetadata {
  startTime: Date;
  retryCount?: number;
  skipErrorNotification?: boolean;
}

/**
 * Configuração de requisição Axios com metadata customizada
 */
export interface AxiosRequestConfigWithMetadata extends AxiosRequestConfig {
  metadata?: RequestMetadata;
  skipErrorNotification?: boolean;
  skipQueue?: boolean;
}

/**
 * Configuração interna de requisição Axios com metadata customizada
 */
export interface InternalAxiosRequestConfigWithMetadata
  extends InternalAxiosRequestConfig {
  metadata?: RequestMetadata;
  skipErrorNotification?: boolean;
}

/**
 * Resposta Axios com metadata customizada
 */
export interface AxiosResponseWithMetadata<T = any> extends AxiosResponse<T> {
  config: InternalAxiosRequestConfigWithMetadata;
}

/**
 * Opções para requisições individuais
 */
export interface RequestOptions {
  skipErrorNotification?: boolean;
  skipQueue?: boolean;
  retryAttempts?: number;
}
