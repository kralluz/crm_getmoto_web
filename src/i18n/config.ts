import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR';
import en from './locales/en';
import es from './locales/es';

const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
  es: { translation: es },
};

// Obter idioma salvo
let savedLanguage = 'pt-BR';
try {
  const languageStorage = localStorage.getItem('language-storage');
  if (languageStorage) {
    const parsed = JSON.parse(languageStorage);
    savedLanguage = parsed?.state?.language || 'pt-BR';
  }
} catch (error) {
  console.warn('Failed to load language from localStorage:', error);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
