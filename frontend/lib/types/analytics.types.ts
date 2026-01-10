// ============================================================================
// TIPOS DE ANALYTICS - Sistema SaaS
// ============================================================================
// Tipos TypeScript que reflejan los DTOs del backend de analytics
// Sincronizados con: backend/src/analytics/dto/

// ============================================================================
// VENTAS MENSUALES
// ============================================================================

/**
 * Venta Mensual
 * Representa las métricas de ventas de un mes específico
 * Mapea a: backend/src/analytics/dto/ventas-mensuales-response.dto.ts
 */
export interface VentaMensualDto {
  mes: string; // Formato: YYYY-MM
  mesNombre: string; // Ej: "Enero 2025"
  total: number;
  cantidad: number;
  promedio: number;
}

/**
 * Respuesta de Ventas Mensuales
 * Incluye los datos de cada mes y totales del período
 */
export interface VentasMensualesResponseDto {
  meses: VentaMensualDto[];
  totalPeriodo: number;
  promedioMensual: number;
}

// ============================================================================
// COMPARATIVA MENSUAL
// ============================================================================

/**
 * Métricas de un Mes
 * Métricas detalladas de ventas y cobros de un mes
 */
export interface MetricasMesDto {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  totalCobrado: number;
  totalPendiente: number;
}

/**
 * Datos de un Mes
 * Información de un mes con sus métricas
 */
export interface DatosMesDto {
  mes: string; // Formato: YYYY-MM
  mesNombre: string; // Ej: "Enero 2026"
  metricas: MetricasMesDto;
}

/**
 * Variaciones Porcentuales
 * Variaciones porcentuales entre dos períodos
 */
export interface VariacionesDto {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  totalCobrado: number;
}

/**
 * Respuesta de Comparativa Mensual
 * Compara el mes actual con el mes anterior
 */
export interface ComparativaMensualResponseDto {
  mesActual: DatosMesDto;
  mesAnterior: DatosMesDto;
  variaciones: VariacionesDto;
}

// ============================================================================
// CUENTAS POR COBRAR
// ============================================================================

/**
 * Cliente Moroso
 * Información de un cliente con deuda pendiente
 */
export interface ClienteMorosoDto {
  clienteId: string;
  clienteNombre: string;
  saldoTotal: number;
  cantidadComprobantes: number;
  comprobanteMasAntiguo: string; // ISO 8601
  diasVencimiento: number;
}

/**
 * Respuesta de Cuentas por Cobrar
 * Incluye totales generales y listado de clientes morosos
 */
export interface CuentasPorCobrarResponseDto {
  totalGeneral: number;
  cantidadClientes: number;
  clientesMorosos: ClienteMorosoDto[];
  promedioDeuda: number;
}

// ============================================================================
// STOCK CRÍTICO
// ============================================================================

/**
 * Categoría Simple
 * Información básica de una categoría
 */
export interface CategoriaSimpleDto {
  id: string;
  nombre: string;
}

/**
 * Producto Crítico
 * Información de un producto con stock crítico
 */
export interface ProductoCriticoDto {
  id: string;
  nombre: string;
  codigoBarras: string | null;
  stockActual: number;
  stockMinimo: number;
  deficit: number;
  categoria: CategoriaSimpleDto | null;
}

/**
 * Respuesta de Stock Crítico
 * Incluye productos con stock bajo el mínimo
 */
export interface StockCriticoResponseDto {
  productos: ProductoCriticoDto[];
  totalProductosCriticos: number;
  totalDeficit: number;
}
