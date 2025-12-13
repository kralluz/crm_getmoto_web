import dayjs from 'dayjs';

/**
 * Obtém o formato de data baseado no idioma
 */
function getDateFormat(lang: string): string {
  // Formatos de data por idioma
  const formats: Record<string, string> = {
    'pt-BR': 'DD/MM/YYYY',
    'en': 'DD/MM/YYYY',      // UK format
    'en-US': 'MM/DD/YYYY',   // US format
    'es': 'DD/MM/YYYY',      // Spanish format
  };
  
  return formats[lang] || 'DD/MM/YYYY';
}

/**
 * Obtém o formato de data/hora baseado no idioma
 */
function getDateTimeFormat(lang: string): string {
  // Formatos de data/hora por idioma
  const formats: Record<string, string> = {
    'pt-BR': 'DD/MM/YYYY HH:mm',
    'en': 'DD/MM/YYYY HH:mm',
    'en-US': 'MM/DD/YYYY HH:mm',
    'es': 'DD/MM/YYYY HH:mm',
  };
  
  return formats[lang] || 'DD/MM/YYYY HH:mm';
}

/**
 * Obtém o formato de mês/dia baseado no idioma
 */
function getMonthDayFormat(lang: string): string {
  const formats: Record<string, string> = {
    'pt-BR': 'DD/MM',
    'en': 'DD/MM',
    'en-US': 'MM/DD',
    'es': 'DD/MM',
  };
  
  return formats[lang] || 'DD/MM';
}

/**
 * Converte valores Decimal do Prisma para número
 * Prisma retorna Decimal em formato especial: {s: sign, e: exponent, d: digits[]}
 */
export function parseDecimal(value: any): number {
  if (typeof value === 'number') return value;

  if (value && typeof value === 'object' && 'd' in value) {
    const sign = value.s || 1;
    const exponent = value.e || 0;
    const digits = value.d || [0];
    const numStr = digits.join('');
    const num = parseFloat(numStr) * Math.pow(10, exponent - digits.length + 1);
    return sign * num;
  }

  return 0;
}

/**
 * Formata valor numérico para libra esterlina (GBP)
 */
export function formatCurrency(value: any): string {
  const numValue = parseDecimal(value);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(numValue);
}

/**
 * Formata data/hora baseado no idioma
 * @param date Data a ser formatada
 * @param lang Idioma (pt-BR, en, es)
 * @param customFormat Formato customizado opcional
 */
export function formatDateTime(date?: string | Date, lang: string = 'pt-BR', customFormat?: string): string {
  if (!date) return '-';
  const format = customFormat || getDateTimeFormat(lang);
  return dayjs(date).format(format);
}

/**
 * Formata apenas data (sem hora) baseado no idioma
 * @param date Data a ser formatada
 * @param lang Idioma (pt-BR, en, es)
 */
export function formatDate(date?: string | Date, lang: string = 'pt-BR'): string {
  if (!date) return '-';
  return dayjs(date).format(getDateFormat(lang));
}

/**
 * Formata mês/dia baseado no idioma
 * @param date Data a ser formatada
 * @param lang Idioma (pt-BR, en, es)
 */
export function formatMonthDay(date?: string | Date, lang: string = 'pt-BR'): string {
  if (!date) return '-';
  return dayjs(date).format(getMonthDayFormat(lang));
}

/**
 * Formata apenas hora (sem data)
 */
export function formatTime(date?: string | Date): string {
  if (!date) return '-';
  return dayjs(date).format('HH:mm');
}

/**
 * Formata número com casas decimais
 */
export function formatNumber(value: any, decimals: number = 2): string {
  const numValue = parseDecimal(value);
  return numValue.toFixed(decimals);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
