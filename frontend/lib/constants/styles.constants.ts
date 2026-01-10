// ============================================================================
// STYLES CONSTANTS - Constantes de estilos para consistencia en la UI
// ============================================================================

/**
 * Gradientes comunes usados en la aplicación
 */
export const GRADIENTS = {
  // Gradientes principales
  BLUE: 'bg-gradient-to-r from-red-600 to-red-700',
  PURPLE: 'bg-gradient-to-r from-purple-600 to-purple-700',
  GREEN: 'bg-gradient-to-r from-green-600 to-green-700',
  RED: 'bg-gradient-to-r from-red-600 to-red-700',
  CYAN: 'bg-gradient-to-r from-cyan-600 to-cyan-700',
  ORANGE: 'bg-gradient-to-r from-orange-600 to-orange-700',
  
  // Gradientes de íconos (br = bottom-right)
  BLUE_BR: 'bg-gradient-to-br from-red-500 to-red-600',
  PURPLE_BR: 'bg-gradient-to-br from-purple-500 to-purple-600',
  GREEN_BR: 'bg-gradient-to-br from-green-500 to-green-600',
  RED_BR: 'bg-gradient-to-br from-red-500 to-red-600',
  CYAN_BR: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
  ORANGE_BR: 'bg-gradient-to-br from-orange-500 to-orange-600',
  YELLOW_BR: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
} as const;

/**
 * Estilos de badges de estado
 */
export const BADGE_STYLES = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DANGER: 'bg-red-100 text-red-800 border-red-200',
  INFO: 'bg-red-100 text-red-800 border-red-200',
  NEUTRAL: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

/**
 * Estilos de botones primarios
 */
export const BUTTON_STYLES = {
  PRIMARY: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium',
  SECONDARY: 'px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium',
  SUCCESS: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium',
  DANGER: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium',
  PURPLE: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium',
  CYAN: 'px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium',
} as const;

/**
 * Estilos de inputs
 */
export const INPUT_STYLES = {
  BASE: 'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-red-500',
  ERROR: 'border-red-300 focus:ring-red-500',
  SUCCESS: 'border-green-300 focus:ring-green-500',
} as const;

/**
 * Estilos de modales
 */
export const MODAL_STYLES = {
  BACKDROP: 'fixed inset-0 bg-black bg-opacity-50 transition-opacity',
  CONTAINER: 'flex min-h-full items-center justify-center p-4',
  CONTENT: 'relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all',
  CONTENT_WIDE: 'relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all',
} as const;

/**
 * Estilos de cards
 */
export const CARD_STYLES = {
  BASE: 'bg-white rounded-xl border border-gray-200 shadow-sm',
  HOVER: 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300',
  INTERACTIVE: 'bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300',
} as const;

/**
 * Colores de texto según estado de pago
 */
export const PAYMENT_STATUS_COLORS = {
  PAID: 'text-green-600',
  PARTIAL: 'text-yellow-600',
  PENDING: 'text-red-600',
} as const;
