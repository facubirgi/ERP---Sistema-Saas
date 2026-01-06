/**
 * TIPOS DE ERRORES - Sistema Centralizado
 */

/**
 * Tipos de errores clasificados
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Severidad del error
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error de aplicación personalizado
 */
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  statusCode?: number;
  originalError?: unknown;
  timestamp: Date;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;

  constructor(params: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    statusCode?: number;
    originalError?: unknown;
    technicalMessage?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.type = params.type;
    this.severity = params.severity;
    this.userMessage = params.userMessage;
    this.statusCode = params.statusCode;
    this.originalError = params.originalError;
    this.technicalMessage = params.technicalMessage;
    this.timestamp = new Date();
    this.retryable = params.retryable ?? false;

    // Mantener stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Crear error desde respuesta de API
   */
  static fromApiError(error: unknown): AppError {
    const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    const status = err.response?.status || 0;
    const data = err.response?.data;
    const message = data?.message || err.message || 'Error desconocido';

    // Clasificar por código de estado HTTP
    if (!err.response) {
      // Error de red (sin respuesta)
      return new AppError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.ERROR,
        message: 'Error de conexión',
        userMessage:
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        originalError: error,
        retryable: true,
      });
    }

    switch (status) {
      case 400:
        return new AppError({
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.WARNING,
          message,
          userMessage: message,
          statusCode: status,
          originalError: error,
          retryable: false,
        });

      case 401:
        return new AppError({
          type: ErrorType.UNAUTHORIZED,
          severity: ErrorSeverity.WARNING,
          message: 'No autenticado',
          userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          statusCode: status,
          originalError: error,
          retryable: false,
        });

      case 403:
        return new AppError({
          type: ErrorType.FORBIDDEN,
          severity: ErrorSeverity.WARNING,
          message: 'Acceso denegado',
          userMessage: 'No tienes permisos para realizar esta acción.',
          statusCode: status,
          originalError: error,
          retryable: false,
        });

      case 404:
        return new AppError({
          type: ErrorType.NOT_FOUND,
          severity: ErrorSeverity.WARNING,
          message: 'Recurso no encontrado',
          userMessage: message || 'El recurso solicitado no existe.',
          statusCode: status,
          originalError: error,
          retryable: false,
        });

      case 500:
      case 502:
      case 503:
        return new AppError({
          type: ErrorType.SERVER,
          severity: ErrorSeverity.CRITICAL,
          message: 'Error del servidor',
          userMessage:
            'Ocurrió un error en el servidor. Estamos trabajando para solucionarlo.',
          statusCode: status,
          originalError: error,
          technicalMessage: message,
          retryable: true,
        });

      default:
        return new AppError({
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.ERROR,
          message: message,
          userMessage: message || 'Ocurrió un error inesperado.',
          statusCode: status,
          originalError: error,
          retryable: false,
        });
    }
  }

  /**
   * Convertir a objeto plano para logging
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}
