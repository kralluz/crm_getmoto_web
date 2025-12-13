/**
 * Serviço de formatação
 * Formata datas, números, moedas, etc.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export type DateFormat = 'short' | 'medium' | 'long' | 'full';

export class FormatService {
  /**
   * Formata data
   */
  static date(
    date: Date | string | number,
    format: DateFormat | string = 'medium',
    locale = 'pt-BR'
  ): string {
    const dayjsDate = dayjs(date);

    // Define locale
    const localeMap: Record<string, string> = {
      'pt-BR': 'pt-br',
      'en': 'en',
      'es': 'es',
    };
    dayjsDate.locale(localeMap[locale] || 'pt-br');

    // Formatos predefinidos baseados no idioma
    const getFormats = (loc: string): Record<DateFormat, string> => {
      // Português brasileiro
      if (loc === 'pt-BR') {
        return {
          short: 'DD/MM/YYYY',
          medium: 'DD/MM/YYYY HH:mm',
          long: 'DD [de] MMMM [de] YYYY',
          full: 'dddd, DD [de] MMMM [de] YYYY [às] HH:mm',
        };
      }
      
      // Inglês UK
      if (loc === 'en') {
        return {
          short: 'DD/MM/YYYY',
          medium: 'DD/MM/YYYY HH:mm',
          long: 'DD MMMM YYYY',
          full: 'dddd, DD MMMM YYYY [at] HH:mm',
        };
      }
      
      // Espanhol
      if (loc === 'es') {
        return {
          short: 'DD/MM/YYYY',
          medium: 'DD/MM/YYYY HH:mm',
          long: 'DD [de] MMMM [de] YYYY',
          full: 'dddd, DD [de] MMMM [de] YYYY [a las] HH:mm',
        };
      }
      
      // Default
      return {
        short: 'DD/MM/YYYY',
        medium: 'DD/MM/YYYY HH:mm',
        long: 'DD MMMM YYYY',
        full: 'dddd, DD MMMM YYYY HH:mm',
      };
    };

    const formats = getFormats(locale);
    const formatString = formats[format as DateFormat] || format;
    
    // Para formato 'short' (apenas data), usa UTC para evitar conversão de timezone
    if (format === 'short' && typeof date === 'string' && date.includes('T')) {
      return dayjs.utc(date).format(formatString);
    }
    
    return dayjsDate.format(formatString);
  }

  /**
   * Formata data relativa (ex: "há 2 horas")
   */
  static dateRelative(date: Date | string | number, locale = 'pt-BR'): string {
    const dayjsDate = dayjs(date);

    const localeMap: Record<string, string> = {
      'pt-BR': 'pt-br',
      'en': 'en',
      'es': 'es',
    };
    dayjsDate.locale(localeMap[locale] || 'pt-br');

    return dayjsDate.fromNow();
  }

  /**
   * Formata moeda (Libra Esterlina - GBP)
   */
  static currency(
    value: number,
    currency = 'GBP',
    locale = 'en-GB'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Formata número
   */
  static number(
    value: number,
    decimals = 2,
    locale = 'pt-BR'
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Formata percentual
   */
  static percent(value: number, decimals = 2, locale = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }

  /**
   * Formata CPF (000.000.000-00)
   */
  static cpf(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata CNPJ (00.000.000/0000-00)
   */
  static cnpj(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }

  /**
   * Formata telefone brasileiro
   */
  static phone(value: string): string {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 11) {
      // Celular: (00) 00000-0000
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      // Fixo: (00) 0000-0000
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return value;
  }

  /**
   * Formata CEP (00000-000)
   */
  static cep(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formata tamanho de arquivo (bytes)
   */
  static fileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
    );
  }

  /**
   * Trunca texto
   */
  static truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Capitaliza primeira letra
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Capitaliza todas as palavras
   */
  static titleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => this.capitalize(word))
      .join(' ');
  }
}
