// ============================================================================
// VALIDATION UTILS - Utilidades para validaciones comunes
// ============================================================================

/**
 * Límites de montos monetarios
 */
export const MONEY_LIMITS = {
  MIN: 0.01,
  MAX: 9999999.99,
} as const;

/**
 * Límites de longitud de texto
 */
export const TEXT_LIMITS = {
  NOMBRE_MIN: 1,
  NOMBRE_MAX: 200,
  DIRECCION_MAX: 300,
  DESCRIPCION_MAX: 500,
} as const;

/**
 * Valida que un monto monetario sea válido
 * @param amount - Monto a validar
 * @returns Objeto con resultado de validación
 */
export function validateAmount(amount: string | number): {
  isValid: boolean;
  error?: string;
  value?: number;
} {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numValue) || !isFinite(numValue)) {
    return { isValid: false, error: 'El monto debe ser un número válido' };
  }

  if (numValue < MONEY_LIMITS.MIN) {
    return { isValid: false, error: `El monto debe ser al menos $${MONEY_LIMITS.MIN}` };
  }

  if (numValue > MONEY_LIMITS.MAX) {
    return { isValid: false, error: `El monto no puede exceder $${MONEY_LIMITS.MAX}` };
  }

  return { isValid: true, value: numValue };
}

/**
 * Valida que un texto tenga la longitud adecuada
 * @param text - Texto a validar
 * @param min - Longitud mínima
 * @param max - Longitud máxima
 * @param fieldName - Nombre del campo para mensaje de error
 * @returns Objeto con resultado de validación
 */
export function validateTextLength(
  text: string,
  min: number,
  max: number,
  fieldName = 'El campo'
): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = text.trim();

  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} es obligatorio` };
  }

  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} no puede exceder ${max} caracteres` };
  }

  return { isValid: true };
}

/**
 * Valida un email
 * @param email - Email a validar
 * @returns true si el email es válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que un array no esté vacío
 * @param array - Array a validar
 * @param fieldName - Nombre del campo para mensaje de error
 * @returns Objeto con resultado de validación
 */
export function validateArrayNotEmpty<T>(
  array: T[],
  fieldName = 'La lista'
): {
  isValid: boolean;
  error?: string;
} {
  if (!Array.isArray(array) || array.length === 0) {
    return { isValid: false, error: `${fieldName} no puede estar vacía` };
  }

  return { isValid: true };
}
