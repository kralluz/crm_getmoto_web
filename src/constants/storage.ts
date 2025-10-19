/**
 * Constantes relacionadas ao Storage (localStorage/sessionStorage)
 */

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  SEARCH_HISTORY: 'search_history',
} as const;

export const STORAGE_CONFIG = {
  MAX_SEARCH_HISTORY: 10,
  MAX_RECENTLY_VIEWED: 20,
} as const;
