/**
 * Exportação centralizada de utilitários
 */

export * from './logger';

/**
 * Converte um valor Decimal do PostgreSQL para número
 * O PostgreSQL retorna decimals como objetos { s: number, e: number, d: number[] }
 */
export function parseDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  
  // Se for um objeto Decimal do PostgreSQL
  if (typeof value === 'object' && 'd' in value && Array.isArray(value.d)) {
    const sign = value.s || 1;
    const exponent = value.e || 0;
    const digits = value.d || [];
    
    // Concatena os dígitos e converte para número
    const numStr = digits.join('');
    const num = parseInt(numStr, 10);
    
    // Aplica o expoente
    const result = num * Math.pow(10, exponent - digits.length + 1);
    
    return sign * result;
  }
  
  return 0;
}
