import { useTranslation } from 'react-i18next';
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, formatMonthDay as formatMonthDayUtil } from '../utils/format.util';

/**
 * Hook para formatação de datas que reage a mudanças de idioma
 * Quando o idioma muda via i18n, os componentes que usam este hook re-renderizam automaticamente
 */
export function useDateFormat() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return {
    /**
     * Formata data no formato do idioma atual (DD/MM/YYYY, MM/DD/YYYY, etc)
     */
    formatDate: (date?: string | Date) => formatDateUtil(date, currentLanguage),
    
    /**
     * Formata data e hora no formato do idioma atual
     */
    formatDateTime: (date?: string | Date, customFormat?: string) => 
      formatDateTimeUtil(date, currentLanguage, customFormat),
    
    /**
     * Formata apenas mês e dia no formato do idioma atual
     */
    formatMonthDay: (date?: string | Date) => formatMonthDayUtil(date, currentLanguage),
  };
}
