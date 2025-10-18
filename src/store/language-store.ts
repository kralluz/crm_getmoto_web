import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'pt-BR' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

/**
 * Store Zustand para gerenciamento de idioma
 * Utiliza middleware de persistência para manter o idioma no localStorage
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'pt-BR',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
