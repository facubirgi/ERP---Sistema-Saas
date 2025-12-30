/**
 * HOOK: useErrorHandler
 *
 * Hook personalizado que integra el sistema de manejo de errores
 * con las notificaciones toast
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import { withErrorHandling, ErrorHandlerOptions, crudErrorMessages } from '@/lib/utils/error-handler';

export function useErrorHandler() {
  const { error: showError, success: showSuccess } = useNotifications();
  const router = useRouter();

  /**
   * Manejar error 401 - Redirigir al login
   */
  const handleUnauthorized = useCallback(() => {
    showError(
      'Sesión Expirada',
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    );
    // Pequeño delay para que se vea la notificación antes de redirigir
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  }, [router, showError]);

  /**
   * Ejecutar función con manejo de errores automático
   */
  const handleAsync = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: Partial<ErrorHandlerOptions>
    ): Promise<T | null> => {
      return withErrorHandling(fn, {
        onError: showError,
        onSuccess: showSuccess,
        onUnauthorized: handleUnauthorized,
        ...options,
      });
    },
    [showError, showSuccess, handleUnauthorized]
  );

  /**
   * Helpers para operaciones CRUD
   */
  const crud = {
    /**
     * Crear entidad
     */
    create: async <T,>(
      fn: () => Promise<T>,
      entityName: string,
      options?: Partial<ErrorHandlerOptions>
    ): Promise<T | null> => {
      const result = await handleAsync(fn, {
        customMessage: options?.customMessage || crudErrorMessages.create.error(entityName).message,
        ...options,
      });

      if (result) {
        const { title, message } = crudErrorMessages.create.success(entityName);
        showSuccess(title, message);
      }

      return result;
    },

    /**
     * Actualizar entidad
     */
    update: async <T,>(
      fn: () => Promise<T>,
      entityName: string,
      options?: Partial<ErrorHandlerOptions>
    ): Promise<T | null> => {
      const result = await handleAsync(fn, {
        customMessage: options?.customMessage || crudErrorMessages.update.error(entityName).message,
        ...options,
      });

      if (result) {
        const { title, message } = crudErrorMessages.update.success(entityName);
        showSuccess(title, message);
      }

      return result;
    },

    /**
     * Eliminar entidad
     */
    delete: async (
      fn: () => Promise<void>,
      entityName: string,
      options?: Partial<ErrorHandlerOptions>
    ): Promise<boolean> => {
      const result = await handleAsync(fn, {
        customMessage: options?.customMessage || crudErrorMessages.delete.error(entityName).message,
        ...options,
      });

      if (result !== null) {
        const { title, message } = crudErrorMessages.delete.success(entityName);
        showSuccess(title, message);
        return true;
      }

      return false;
    },

    /**
     * Obtener/listar entidades
     */
    fetch: async <T,>(
      fn: () => Promise<T>,
      entityName: string,
      options?: Partial<ErrorHandlerOptions>
    ): Promise<T | null> => {
      return handleAsync(fn, {
        customMessage: options?.customMessage || crudErrorMessages.fetch.error(entityName).message,
        enableRetry: true, // Habilitar retry para consultas
        maxRetries: 2,
        ...options,
      });
    },
  };

  return {
    handleAsync,
    crud,
    showError,
    showSuccess,
  };
}
