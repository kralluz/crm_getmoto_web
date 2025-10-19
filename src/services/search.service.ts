/**
 * Serviço de busca
 * Gerencia histórico de buscas e lógica relacionada
 */

import { STORAGE_KEYS, STORAGE_CONFIG } from '../constants';
import { StorageService } from './storage.service';
import { serviceLogger } from '../utils/logger';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
}

export class SearchService {
  /**
   * Salva busca no histórico
   */
  static saveToHistory(query: string): void {
    if (!query.trim()) return;

    try {
      const history = this.getHistory();

      // Remove duplicatas
      const filtered = history.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );

      // Adiciona nova busca no início
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date(),
      };

      const updated = [newItem, ...filtered].slice(
        0,
        STORAGE_CONFIG.MAX_SEARCH_HISTORY
      );

      StorageService.setItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
      serviceLogger.debug('Search saved to history', { query });
    } catch (error) {
      serviceLogger.error('Failed to save search to history', error as Error, {
        query,
      });
    }
  }

  /**
   * Obtém histórico de buscas
   */
  static getHistory(): SearchHistoryItem[] {
    try {
      const history = StorageService.getItem<SearchHistoryItem[]>(
        STORAGE_KEYS.SEARCH_HISTORY
      );

      if (!history) return [];

      // Converte strings de data para objetos Date
      return history.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      serviceLogger.error('Failed to get search history', error as Error);
      return [];
    }
  }

  /**
   * Remove item do histórico
   */
  static removeFromHistory(id: string): void {
    try {
      const history = this.getHistory();
      const updated = history.filter((item) => item.id !== id);
      StorageService.setItem(STORAGE_KEYS.SEARCH_HISTORY, updated);
      serviceLogger.debug('Search removed from history', { id });
    } catch (error) {
      serviceLogger.error('Failed to remove search from history', error as Error, {
        id,
      });
    }
  }

  /**
   * Limpa todo o histórico
   */
  static clearHistory(): void {
    try {
      StorageService.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
      serviceLogger.info('Search history cleared');
    } catch (error) {
      serviceLogger.error('Failed to clear search history', error as Error);
    }
  }

  /**
   * Busca sugestões baseadas no histórico
   */
  static getSuggestions(query: string, limit = 5): SearchHistoryItem[] {
    if (!query.trim()) return [];

    const history = this.getHistory();
    const normalizedQuery = query.toLowerCase();

    return history
      .filter((item) =>
        item.query.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, limit);
  }
}
