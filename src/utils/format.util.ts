import dayjs from 'dayjs';

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
 * Formata data/hora para formato brasileiro
 */
export function formatDateTime(date?: string | Date, format: string = 'DD/MM/YYYY HH:mm'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * Formata apenas data (sem hora)
 */
export function formatDate(date?: string | Date): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
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
