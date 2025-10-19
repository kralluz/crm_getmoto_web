/**
 * Hook para usar formatação
 * Facilita o uso do FormatService em componentes
 */

import { useCallback } from 'react';
import { FormatService } from '../services';
import { useLanguageStore } from '../store/language-store';
import type { DateFormat } from '../services/format.service';

/**
 * Hook para formatação com locale automático
 */
export function useFormat() {
  const { language } = useLanguageStore();

  const date = useCallback(
    (date: Date | string | number, format?: DateFormat | string) => {
      return FormatService.date(date, format, language);
    },
    [language]
  );

  const dateRelative = useCallback(
    (date: Date | string | number) => {
      return FormatService.dateRelative(date, language);
    },
    [language]
  );

  const currency = useCallback(
    (value: number, currencyCode = 'BRL') => {
      return FormatService.currency(value, currencyCode, language);
    },
    [language]
  );

  const number = useCallback(
    (value: number, decimals?: number) => {
      return FormatService.number(value, decimals, language);
    },
    [language]
  );

  const percent = useCallback(
    (value: number, decimals?: number) => {
      return FormatService.percent(value, decimals, language);
    },
    [language]
  );

  return {
    // Datas
    date,
    dateRelative,

    // Números e moeda
    currency,
    number,
    percent,

    // Documentos brasileiros
    cpf: FormatService.cpf,
    cnpj: FormatService.cnpj,
    phone: FormatService.phone,
    cep: FormatService.cep,

    // Utilitários
    fileSize: FormatService.fileSize,
    truncate: FormatService.truncate,
    capitalize: FormatService.capitalize,
    titleCase: FormatService.titleCase,
  };
}
