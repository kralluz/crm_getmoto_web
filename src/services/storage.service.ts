/**
 * Serviço de Storage
 * Gerencia operações de localStorage/sessionStorage de forma tipada e segura
 */

import { STORAGE_KEYS } from '../constants';
import { serviceLogger } from '../utils/logger';

export class StorageService {
  /**
   * Salva item no localStorage
   */
  static setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      serviceLogger.debug(`Item saved to localStorage: ${key}`);
    } catch (error) {
      serviceLogger.error(
        `Failed to save item to localStorage: ${key}`,
        error as Error
      );
    }
  }

  /**
   * Obtém item do localStorage
   */
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Tenta fazer parse como JSON
      try {
        return JSON.parse(item) as T;
      } catch (parseError) {
        // Se falhar, retorna a string diretamente (caso de JWT tokens salvos sem stringify)
        serviceLogger.debug(`Item ${key} is not JSON, returning as string`);
        return item as T;
      }
    } catch (error) {
      serviceLogger.error(
        `Failed to get item from localStorage: ${key}`,
        error as Error
      );
      return null;
    }
  }

  /**
   * Remove item do localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      serviceLogger.debug(`Item removed from localStorage: ${key}`);
    } catch (error) {
      serviceLogger.error(
        `Failed to remove item from localStorage: ${key}`,
        error as Error
      );
    }
  }

  /**
   * Limpa todo o localStorage
   */
  static clear(): void {
    try {
      localStorage.clear();
      serviceLogger.info('LocalStorage cleared');
    } catch (error) {
      serviceLogger.error('Failed to clear localStorage', error as Error);
    }
  }

  /**
   * Verifica se uma chave existe
   */
  static hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  // ============================================================================
  // Métodos específicos para chaves da aplicação
  // ============================================================================

  /**
   * Salva token de autenticação
   */
  static setAuthToken(token: string): void {
    this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Obtém token de autenticação
   */
  static getAuthToken(): string | null {
    return this.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Remove token de autenticação
   */
  static removeAuthToken(): void {
    this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Salva dados do usuário
   */
  static setUserData<T>(userData: T): void {
    this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  /**
   * Obtém dados do usuário
   */
  static getUserData<T>(): T | null {
    return this.getItem<T>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Remove dados do usuário
   */
  static removeUserData(): void {
    this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Limpa dados de autenticação (logout)
   */
  static clearAuthData(): void {
    this.removeAuthToken();
    this.removeUserData();
    serviceLogger.info('Auth data cleared');
  }
}
