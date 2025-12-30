// ============================================================================
// NUMBER UTILS - Utilidades para manejo seguro de números
// ============================================================================

/**
 * Parsea un string a número de forma segura
 * @param value - Valor a parsear
 * @param defaultValue - Valor por defecto si el parseo falla
 * @returns Número parseado o valor por defecto
 */
export function safeParseFloat(value: string | number, defaultValue = 0): number {
  if (typeof value === 'number') {
    return isFinite(value) ? value : defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

/**
 * Parsea un string a entero de forma segura
 * @param value - Valor a parsear
 * @param defaultValue - Valor por defecto si el parseo falla
 * @returns Entero parseado o valor por defecto
 */
export function safeParseInt(value: string | number, defaultValue = 0): number {
  if (typeof value === 'number') {
    return isFinite(value) ? Math.floor(value) : defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
}

/**
 * Valida que un número esté dentro de un rango
 * @param value - Valor a validar
 * @param min - Valor mínimo (inclusive)
 * @param max - Valor máximo (inclusive)
 * @returns true si el valor está en el rango
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isFinite(value) && value >= min && value <= max;
}

/**
 * Redondea un número a cierta cantidad de decimales
 * @param value - Valor a redondear
 * @param decimals - Cantidad de decimales
 * @returns Número redondeado
 */
export function roundToDecimals(value: number, decimals = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Limita un número a un valor máximo y mínimo
 * @param value - Valor a limitar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Valor limitado
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
