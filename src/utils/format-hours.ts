/**
 * Formata horas para exibição
 * - Se for número inteiro: exibe sem decimais (8, 9, 24)
 * - Se tiver decimais: exibe com 2 casas (8.50, 9.75)
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '-';
  
  const numHours = Number(hours);
  
  // Se for inteiro, exibe sem decimais
  if (Number.isInteger(numHours)) {
    return numHours.toString();
  }
  
  // Se tiver decimais, exibe com 2 casas
  return numHours.toFixed(2);
}
