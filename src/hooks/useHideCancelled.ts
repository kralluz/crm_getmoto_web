import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hideCancelled';

/**
 * Hook para gerenciar a preferência de ocultar itens cancelados
 * Salva a preferência no localStorage de forma persistente
 *
 * @param pageKey - Chave única para identificar a página (ex: 'dashboard', 'serviceOrders', 'expenses')
 * @returns Objeto com estado e função para alterar
 */
export function useHideCancelled(pageKey: string) {
  const storageKey = `${STORAGE_KEY}_${pageKey}`;

  // Inicializa com valor do localStorage, padrão é true (ocultar)
  const [hideCancelled, setHideCancelled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : true; // Por padrão, oculta cancelados
    } catch {
      return true;
    }
  });

  // Salva no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(hideCancelled));
    } catch (error) {
      console.error('Erro ao salvar preferência de ocultar cancelamentos:', error);
    }
  }, [hideCancelled, storageKey]);

  return { hideCancelled, setHideCancelled };
}
