// ============================================================================
// INVENTARIO CONSTANTS - Constantes del módulo de inventario
// ============================================================================
// Constantes centralizadas para evitar magic numbers y facilitar mantenimiento

/**
 * Threshold para determinar stock crítico
 * Un producto está en estado crítico si su stock es menor o igual al 25% del mínimo
 */
export const STOCK_CRITICO_THRESHOLD = 0.25;

/**
 * Multiplicador para calcular stock objetivo (doble del mínimo)
 */
export const STOCK_OBJETIVO_MULTIPLIER = 2;

/**
 * Límites de paginación por defecto
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Límites de validación para categorías
 */
export const CATEGORIA_VALIDATION = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
} as const;

/**
 * Límites de validación para productos
 */
export const PRODUCTO_VALIDATION = {
  MIN_NOMBRE_LENGTH: 2,
  MAX_NOMBRE_LENGTH: 200,
  MAX_CODIGO_BARRAS_LENGTH: 50,
  MIN_PRECIO: 0,
  MIN_STOCK: 0,
} as const;

/**
 * Configuración de búsqueda
 */
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300, // ms
  MAX_RESULTS: 10,
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  NOMBRE_REQUERIDO: 'El nombre es requerido',
  NOMBRE_INVALIDO: 'El nombre debe tener entre 2 y 200 caracteres',
  CATEGORIA_REQUERIDA: 'La categoría es requerida',
  PRECIO_INVALIDO: 'El precio debe ser mayor a 0',
  STOCK_INVALIDO: 'El stock debe ser mayor o igual a 0',
  CODIGO_BARRAS_DUPLICADO: 'Este código de barras ya está en uso',
} as const;
