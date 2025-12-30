// ============================================================================
// FORMAT UTILITIES - Sistema SaaS
// ============================================================================
// Utilidades para formateo de datos (moneda, fechas, números, etc.)

/**
 * Formatea un número como moneda en pesos argentinos
 * @param value - Valor numérico a formatear
 * @returns String formateado con símbolo $ y separadores de miles
 * @example formatCurrency(1234.56) => "$1,234.56"
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea una fecha a formato local corto
 * @param date - Fecha a formatear
 * @returns String con formato DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatea una fecha a formato ISO para inputs de tipo date
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formatea un número con separadores de miles
 * @param value - Valor numérico a formatear
 * @returns String formateado
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('es-AR');
}
