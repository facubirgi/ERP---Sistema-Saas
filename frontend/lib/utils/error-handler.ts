/**
 * ERROR HANDLER - Utilidades para manejo de errores
 */

import { AppError, ErrorType } from '@/lib/types/error.types';

/**
 * Hook personalizado para manejo de errores con notificaciones
 * NOTA: Este debe ser usado desde componentes, no desde funciones puras
 */
export interface ErrorHandlerOptions {
  /**
   * Función para mostrar notificación de error
   */
  onError: (title: string, message: string) => void;

  /**
   * Función para mostrar notificación de éxito
   */
  onSuccess?: (title: string, message: string) => void;

  /**
   * Mensaje personalizado para mostrar al usuario
   */
  customMessage?: string;

  /**
   * Función callback cuando ocurre error 401 (no autenticado)
   */
  onUnauthorized?: () => void;

  /**
   * Habilitar retry automático para errores de red
   */
  enableRetry?: boolean;

  /**
   * Número máximo de reintentos
   */
  maxRetries?: number;
}

/**
 * Wrapper para ejecutar una función asíncrona con manejo de errores
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions
): Promise<T | null> {
  const { onError, onUnauthorized, customMessage, enableRetry = false, maxRetries = 3 } = options;

  let retries = 0;

  while (retries <= (enableRetry ? maxRetries : 0)) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      const appError = AppError.fromApiError(error);

      // Log en consola para debugging
      console.error('[ErrorHandler]', appError.toJSON());

      // Manejar error 401 (no autenticado)
      if (appError.type === ErrorType.UNAUTHORIZED && onUnauthorized) {
        onUnauthorized();
        return null;
      }

      // Retry automático para errores de red
      if (appError.retryable && enableRetry && retries < maxRetries) {
        retries++;
        console.log(`[ErrorHandler] Reintentando... (${retries}/${maxRetries})`);
        await delay(Math.pow(2, retries) * 1000); // Exponential backoff
        continue;
      }

      // Mostrar notificación de error
      const title = getErrorTitle(appError.type);
      const message = customMessage || appError.userMessage;
      onError(title, message);

      return null;
    }
  }

  return null;
}

/**
 * Obtener título para el error según su tipo
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Error de Conexión';
    case ErrorType.VALIDATION:
      return 'Datos Inválidos';
    case ErrorType.UNAUTHORIZED:
      return 'Sesión Expirada';
    case ErrorType.FORBIDDEN:
      return 'Acceso Denegado';
    case ErrorType.NOT_FOUND:
      return 'No Encontrado';
    case ErrorType.SERVER:
      return 'Error del Servidor';
    default:
      return 'Error';
  }
}

/**
 * Delay helper para retry con exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper para operaciones CRUD con mensajes predefinidos
 */
export const crudErrorMessages = {
  create: {
    success: (entity: string) => ({
      title: 'Creado',
      message: `${entity} creado exitosamente`,
    }),
    error: (entity: string) => ({
      title: 'Error al crear',
      message: `No se pudo crear el ${entity.toLowerCase()}`,
    }),
  },
  update: {
    success: (entity: string) => ({
      title: 'Actualizado',
      message: `${entity} actualizado exitosamente`,
    }),
    error: (entity: string) => ({
      title: 'Error al actualizar',
      message: `No se pudo actualizar el ${entity.toLowerCase()}`,
    }),
  },
  delete: {
    success: (entity: string) => ({
      title: 'Eliminado',
      message: `${entity} eliminado exitosamente`,
    }),
    error: (entity: string) => ({
      title: 'Error al eliminar',
      message: `No se pudo eliminar el ${entity.toLowerCase()}`,
    }),
  },
  fetch: {
    error: (entity: string) => ({
      title: 'Error al cargar',
      message: `No se pudieron cargar los ${entity.toLowerCase()}`,
    }),
  },
};
