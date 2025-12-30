'use client';

/**
 * TOAST CONTAINER - Contenedor de notificaciones toast
 */

import React from 'react';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Obtener íconoy color según el tipo de notificación
 */
function getNotificationStyles(type: NotificationType) {
  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        textColor: 'text-green-900',
      };
    case 'error':
      return {
        Icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
      };
    case 'warning':
      return {
        Icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-900',
      };
    case 'info':
    default:
      return {
        Icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-900',
      };
  }
}

/**
 * Componente de Toast individual
 */
function Toast({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications();
  const { Icon, bgColor, borderColor, iconColor, textColor } = getNotificationStyles(
    notification.type
  );

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-lg p-4 shadow-lg max-w-md w-full
        transform transition-all duration-300 ease-in-out
        hover:shadow-xl`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Ícono */}
        <div className={`${iconColor} shrink-0`}>
          <Icon size={24} />
        </div>

        {/* Contenido */}
        <div className="ml-3 flex-1">
          <h4 className={`text-sm font-semibold ${textColor}`}>{notification.title}</h4>
          <p className={`mt-1 text-sm ${textColor} opacity-90`}>{notification.message}</p>

          {/* Acción opcional */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={`mt-2 text-sm font-medium ${iconColor} hover:underline`}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={() => removeNotification(notification.id)}
          className={`${textColor} opacity-60 hover:opacity-100 transition-opacity shrink-0 ml-2`}
          aria-label="Cerrar notificación"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * Contenedor de todos los toasts
 */
export function ToastContainer() {
  const { notifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast notification={notification} />
        </div>
      ))}
    </div>
  );
}
