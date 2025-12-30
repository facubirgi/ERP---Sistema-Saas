'use client';

/**
 * CONTEXTO DE NOTIFICACIONES - Sistema de Toast
 *
 * Proporciona un sistema centralizado de notificaciones tipo toast
 * para mostrar errores, éxitos y advertencias al usuario.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Tipos de notificación
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interfaz de notificación
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Interfaz del contexto
 */
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Helpers
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider del contexto
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Agregar una notificación
   */
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // 5 segundos por defecto
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-dismiss si tiene duración
    if (newNotification.duration && newNotification.duration > 0) {
      const timeoutId = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, newNotification.duration);

      // Limpiar timeout si el componente se desmonta
      return () => clearTimeout(timeoutId);
    }
  }, []);

  /**
   * Remover una notificación
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /**
   * Limpiar todas las notificaciones
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Helper: Notificación de éxito
   */
  const success = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'success', title, message, duration });
    },
    [addNotification]
  );

  /**
   * Helper: Notificación de error
   */
  const error = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'error', title, message, duration: duration ?? 7000 });
    },
    [addNotification]
  );

  /**
   * Helper: Notificación de advertencia
   */
  const warning = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'warning', title, message, duration });
    },
    [addNotification]
  );

  /**
   * Helper: Notificación informativa
   */
  const info = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({ type: 'info', title, message, duration });
    },
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook para usar el contexto
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
