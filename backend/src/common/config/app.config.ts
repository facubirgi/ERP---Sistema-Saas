/**
 * CONFIGURACIÓN CENTRALIZADA DE LA APLICACIÓN
 *
 * Este archivo centraliza todas las variables de entorno
 * y proporciona valores por defecto seguros.
 */

export const AppConfig = {
  /**
   * Configuración de Inventario
   */
  inventario: {
    /**
     * Margen mínimo permitido en productos (%)
     * 0 = precio venta >= precio costo
     * 10 = precio venta >= precio costo * 1.10
     */
    margenMinimoPorcentaje: Number(process.env.MARGEN_MINIMO_PORCENTAJE) || 0,

    /**
     * Multiplicador para calcular stock bajo
     * 1.0 = stock_actual <= stock_minimo
     * 1.5 = stock_actual <= stock_minimo * 1.5
     */
    stockBajoMultiplicador: Number(process.env.STOCK_BAJO_MULTIPLICADOR) || 1.0,
  },

  /**
   * Configuración de Paginación
   */
  pagination: {
    /**
     * Página por defecto cuando no se especifica
     */
    defaultPage: Number(process.env.PAGINATION_DEFAULT_PAGE) || 1,

    /**
     * Límite de items por página por defecto
     */
    defaultLimit: Number(process.env.PAGINATION_DEFAULT_LIMIT) || 20,

    /**
     * Límite máximo de items por página (seguridad)
     * Previene que un cliente malicioso solicite limit=999999
     */
    maxLimit: Number(process.env.PAGINATION_MAX_LIMIT) || 100,
  },

  /**
   * Configuración de JWT
   */
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  /**
   * Configuración de Base de Datos
   */
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'saas_db',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    ssl: process.env.DATABASE_SSL === 'true',
    poolSize: {
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
      min: Number(process.env.DATABASE_POOL_MIN) || 2,
    },
  },

  /**
   * Configuración de CORS
   */
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  /**
   * Puerto de la aplicación
   */
  port: Number(process.env.APP_PORT) || 3001,
};

/**
 * Validar que las variables de entorno críticas estén configuradas
 */
export function validateConfig(): void {
  const errors: string[] = [];
  const env = process.env.NODE_ENV;

  // JWT
  if (!AppConfig.jwt.secret) {
    errors.push('JWT_SECRET is required');
  } else if (AppConfig.jwt.secret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters for security');
  }

  if (!AppConfig.jwt.refreshSecret) {
    errors.push('JWT_REFRESH_SECRET is required');
  }

  // Inventario
  if (isNaN(AppConfig.inventario.margenMinimoPorcentaje)) {
    errors.push('MARGEN_MINIMO_PORCENTAJE is not a valid number');
  } else if (AppConfig.inventario.margenMinimoPorcentaje < 0) {
    errors.push('MARGEN_MINIMO_PORCENTAJE must be >= 0');
  } else if (AppConfig.inventario.margenMinimoPorcentaje > 1000) {
    errors.push('MARGEN_MINIMO_PORCENTAJE seems unreasonably high (>1000%)');
  }

  if (isNaN(AppConfig.inventario.stockBajoMultiplicador)) {
    errors.push('STOCK_BAJO_MULTIPLICADOR is not a valid number');
  } else if (AppConfig.inventario.stockBajoMultiplicador <= 0) {
    errors.push('STOCK_BAJO_MULTIPLICADOR must be > 0');
  }

  // Paginación
  if (isNaN(AppConfig.pagination.maxLimit)) {
    errors.push('PAGINATION_MAX_LIMIT is not a valid number');
  } else if (AppConfig.pagination.maxLimit < 1) {
    errors.push('PAGINATION_MAX_LIMIT must be >= 1');
  } else if (AppConfig.pagination.maxLimit > 1000) {
    errors.push('PAGINATION_MAX_LIMIT should not exceed 1000 for performance');
  }

  if (AppConfig.pagination.defaultLimit > AppConfig.pagination.maxLimit) {
    errors.push('PAGINATION_DEFAULT_LIMIT cannot exceed PAGINATION_MAX_LIMIT');
  }

  // Base de datos
  if (AppConfig.database.poolSize.min > AppConfig.database.poolSize.max) {
    errors.push('DATABASE_POOL_MIN cannot exceed DATABASE_POOL_MAX');
  }

  if (env === 'production' && AppConfig.database.synchronize) {
    errors.push('DATABASE_SYNCHRONIZE must be false in production!');
  }

  // Puerto
  if (isNaN(AppConfig.port)) {
    errors.push('APP_PORT is not a valid number');
  } else if (AppConfig.port < 1 || AppConfig.port > 65535) {
    errors.push('APP_PORT must be between 1 and 65535');
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `- ${e}`).join('\n')}`,
    );
  }
}
