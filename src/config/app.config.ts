/**
 * Configuração centralizada da aplicação
 * Lê variáveis de ambiente e fornece valores tipados
 */

/**
 * Configuração da API
 */
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000,
  concurrentLimit: Number(import.meta.env.VITE_API_CONCURRENT_LIMIT) || 5,
} as const;

/**
 * Configuração da aplicação
 */
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'CRM GetMoto',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  env: import.meta.env.VITE_APP_ENV || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

/**
 * Feature flags
 */
export const featureFlags = {
  debug: import.meta.env.VITE_FEATURE_DEBUG === 'true',
  verboseLogs: import.meta.env.VITE_FEATURE_VERBOSE_LOGS === 'true',
  mockData: import.meta.env.VITE_FEATURE_MOCK_DATA === 'true',
} as const;

/**
 * Configuração de serviços externos
 */
export const externalServices = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: !!import.meta.env.VITE_SENTRY_DSN,
  },
  logRocket: {
    appId: import.meta.env.VITE_LOGROCKET_APP_ID,
    enabled: !!import.meta.env.VITE_LOGROCKET_APP_ID,
  },
  googleAnalytics: {
    id: import.meta.env.VITE_GA_ID,
    enabled: !!import.meta.env.VITE_GA_ID,
  },
} as const;

/**
 * Configuração de storage
 */
export const storageConfig = {
  prefix: import.meta.env.VITE_STORAGE_PREFIX || 'crm_getmoto',
  maxSearchHistory: Number(import.meta.env.VITE_STORAGE_MAX_SEARCH_HISTORY) || 10,
} as const;

/**
 * Configuração de UI
 */
export const uiConfig = {
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'pt-BR',
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
  notificationDuration: Number(import.meta.env.VITE_NOTIFICATION_DURATION) || 3,
} as const;

/**
 * Configuração completa exportada
 */
export const config = {
  api: apiConfig,
  app: appConfig,
  features: featureFlags,
  external: externalServices,
  storage: storageConfig,
  ui: uiConfig,
} as const;

/**
 * Helper para verificar se está em produção
 */
export const isProduction = (): boolean => appConfig.isProduction;

/**
 * Helper para verificar se está em desenvolvimento
 */
export const isDevelopment = (): boolean => appConfig.isDevelopment;

/**
 * Helper para verificar feature flag
 */
export const isFeatureEnabled = (feature: keyof typeof featureFlags): boolean => {
  return featureFlags[feature];
};

export default config;
