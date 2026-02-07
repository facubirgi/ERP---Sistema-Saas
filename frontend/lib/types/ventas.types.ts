// ============================================================================
// TIPOS DE VENTAS Y COBROS - Sistema SaaS
// ============================================================================
// Tipos TypeScript que reflejan las entidades y DTOs del backend
// Sincronizados con: backend/src/ventas/

// ============================================================================
// ENUMERACIONES
// ============================================================================

/**
 * Tipo de tercero
 * Mapea a: backend/src/ventas/enums/tipo-tercero.enum.ts
 */
export enum TipoTercero {
  CLIENTE = 'CLIENTE',
  PROVEEDOR = 'PROVEEDOR',
}

/**
 * Tipo de comprobante
 * Mapea a: backend/src/ventas/enums/tipo-comprobante.enum.ts
 */
export enum TipoComprobante {
  VENTA = 'VENTA',
  COTIZACION = 'COTIZACION',
}

/**
 * Estado de pago del comprobante
 * Mapea a: backend/src/ventas/enums/estado-pago.enum.ts
 */
export enum EstadoPago {
  PENDIENTE = 'PENDIENTE', // saldoPendiente = total
  PARCIAL = 'PARCIAL', // 0 < saldoPendiente < total
  PAGADO = 'PAGADO', // saldoPendiente = 0
}

/**
 * Método de pago
 * Mapea a: backend/src/ventas/enums/metodo-pago.enum.ts
 */
export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  QR = 'QR',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

// ============================================================================
// ENTIDADES
// ============================================================================

/**
 * Tercero (Cliente o Proveedor)
 * Mapea a: backend/src/ventas/entities/tercero.entity.ts
 */
export interface Tercero {
  id: string; // UUID
  nombre: string;
  direccion: string | null;
  tipo: TipoTercero;
  saldoActual: number; // Decimal - cache de saldo pendiente
  empresaId: string; // UUID - filtrado automático por backend
  eliminado: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comprobante (Venta o Cotización)
 * Mapea a: backend/src/ventas/entities/comprobante.entity.ts
 */
export interface Comprobante {
  id: string; // UUID
  tipo: TipoComprobante;
  total: number; // Decimal
  saldoPendiente: number; // Decimal
  estadoPago: EstadoPago;
  terceroId: string | null; // UUID - nullable para ventas anónimas
  empresaId: string; // UUID
  eliminado: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relaciones incluidas en algunas respuestas
  tercero?: {
    id: string;
    nombre: string;
  };
  detalles?: ComprobanteDetalle[];
  cobros?: Cobro[];
}

/**
 * Detalle del comprobante (Items de venta)
 * Mapea a: backend/src/ventas/entities/comprobante-detalle.entity.ts
 */
export interface ComprobanteDetalle {
  id: string; // UUID
  comprobanteId: string; // UUID
  productoId: string; // UUID
  nombreProducto: string; // Denormalizado - preserva nombre al momento de venta
  cantidad: number;
  precioUnitario: number; // Denormalizado - preserva precio al momento de venta
  subtotal: number; // Denormalizado - cantidad * precioUnitario
  empresaId: string; // UUID
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cobro (Pago asociado a un comprobante)
 * Mapea a: backend/src/ventas/entities/cobro.entity.ts
 */
export interface Cobro {
  id: string; // UUID
  monto: number; // Decimal - positivo (pago) o negativo (devolución)
  fecha: Date;
  metodo: MetodoPago;
  comprobanteId: string; // UUID
  empresaId: string; // UUID
  createdAt: Date;
  updatedAt: Date;
  // Relación incluida en algunas respuestas
  comprobante?: {
    id: string;
    total: number;
    saldoPendiente: number;
    estadoPago: EstadoPago;
  };
}

// ============================================================================
// DTOs - CREATE
// ============================================================================

/**
 * DTO para item de venta
 * Mapea a: backend/src/ventas/dto/item-venta.dto.ts
 */
export interface ItemVentaDto {
  productoId: string; // UUID
  cantidad: number; // >= 1
  precioUnitario: number; // > 0
}

/**
 * DTO para crear nueva venta
 * Mapea a: backend/src/ventas/dto/crear-venta.dto.ts
 */
export interface CrearVentaDto {
  clienteId?: string; // UUID - opcional (null = venta anónima)
  items: ItemVentaDto[]; // Mínimo 1 item
  montoPagado: number; // >= 0
  metodoPago?: MetodoPago; // Requerido si montoPagado > 0
}

/**
 * DTO para crear nuevo tercero
 * Mapea a: backend/src/ventas/terceros/dto/crear-tercero.dto.ts
 */
export interface CrearTerceroDto {
  nombre: string; // Max 200 caracteres
  direccion?: string; // Max 300 caracteres
  tipo: TipoTercero;
}

/**
 * DTO para registrar cobro diferido
 * Mapea a: backend/src/ventas/dto/registrar-cobro.dto.ts
 */
export interface RegistrarCobroDto {
  comprobanteId: string; // UUID
  monto: number; // > 0, <= saldoPendiente
  metodoPago: MetodoPago;
}

// ============================================================================
// DTOs - UPDATE
// ============================================================================

/**
 * DTO para actualizar comprobante
 * Mapea a: backend/src/ventas/dto/actualizar-comprobante.dto.ts
 */
export interface ActualizarComprobanteDto {
  terceroId?: string | null; // Cambiar cliente (solo si saldoPendiente = 0)
}

/**
 * DTO para actualizar tercero
 * Mapea a: backend/src/ventas/terceros/dto/actualizar-tercero.dto.ts
 */
export interface ActualizarTerceroDto {
  nombre?: string;
  direccion?: string;
  tipo?: TipoTercero;
}

/**
 * DTO para actualizar cobro
 * Mapea a: backend/src/ventas/dto/actualizar-cobro.dto.ts
 */
export interface ActualizarCobroDto {
  metodoPago?: MetodoPago;
  fecha?: string; // ISO 8601
}

// ============================================================================
// DTOs - QUERY & PAGINATION
// ============================================================================

/**
 * DTO para listar ventas con filtros
 * Mapea a: backend/src/ventas/dto/listar-ventas-query.dto.ts
 */
export interface ListarVentasQueryDto {
  estadoPago?: EstadoPago;
  clienteId?: string; // UUID
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
  page?: number; // Default 1
  limit?: number; // Default 20
}

/**
 * DTO para listar terceros con filtros
 * Mapea a: backend/src/ventas/terceros/dto/listar-terceros-query.dto.ts
 */
export interface ListarTercerosQueryDto {
  tipo?: TipoTercero;
  busqueda?: string; // Búsqueda por nombre (case-insensitive)
  page?: number;
  limit?: number;
}

/**
 * DTO genérico de paginación
 */
export interface PaginationDto {
  page?: number; // >= 1, default 1
  limit?: number; // 1-100, default 20
}

// ============================================================================
// RESPUESTAS DEL BACKEND
// ============================================================================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Respuesta al crear venta
 * Mapea a: backend/src/ventas/dto/venta-response.dto.ts
 */
export interface VentaResponseDto {
  comprobante: {
    id: string;
    numeroComprobante: string;
    tipo: TipoComprobante;
    total: number;
    saldoPendiente: number;
    estadoPago: EstadoPago;
  };
  cobro: {
    id: string;
    monto: number;
    metodo: MetodoPago;
  } | null;
  mensaje: string;
}

/**
 * Respuesta con detalle completo de venta
 * Mapea a: backend/src/ventas/dto/detalle-venta-response.dto.ts
 */
export interface DetalleVentaResponseDto {
  id: string;
  tipo: TipoComprobante;
  total: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
  tercero?: {
    id: string;
    nombre: string;
  };
  detalles: ComprobanteDetalle[];
  cobros: Cobro[];
  createdAt: Date;
}

/**
 * Respuesta al registrar cobro
 * Mapea a: backend/src/ventas/dto/cobro-response.dto.ts
 */
export interface CobroResponseDto {
  cobro: {
    id: string;
    monto: number;
    metodo: MetodoPago;
    fecha: Date;
  };
  comprobante: {
    id: string;
    saldoPendiente: number;
    estadoPago: EstadoPago;
  };
  mensaje: string;
}

/**
 * Respuesta de deuda de cliente
 * Mapea a: backend/src/ventas/dto/deuda-cliente.dto.ts
 */
export interface DeudaClienteDto {
  id: string;
  fecha: Date;
  total: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
}

/**
 * Respuesta de saldo de tercero
 * Mapea a: backend/src/ventas/terceros/dto/saldo-tercero-response.dto.ts
 */
export interface SaldoTerceroResponseDto {
  clienteNombre: string;
  saldoTotal: number;
  estado: 'DEUDOR' | 'AL_DIA';
}

/**
 * Item de lista de ventas
 * Mapea a: backend/src/ventas/dto/venta-list-item.dto.ts
 */
export interface VentaListItemDto {
  id: string;
  tipo: TipoComprobante;
  total: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
  tercero?: {
    id: string;
    nombre: string;
  };
  cantidadItems: number;
  createdAt: Date;
}

/**
 * Respuesta de tercero
 * Mapea a: backend/src/ventas/terceros/dto/tercero-response.dto.ts
 */
export interface TerceroResponseDto {
  id: string;
  nombre: string;
  direccion: string | null;
  tipo: TipoTercero;
  saldoActual: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TIPOS AUXILIARES PARA UI
// ============================================================================

/**
 * Estado del pago para visualización con colores
 */
export interface EstadoPagoUI {
  label: string;
  color: 'green' | 'yellow' | 'red';
  bgColor: string;
  textColor: string;
  borderColor: string;
}

/**
 * Métricas del módulo de ventas para dashboard
 */
export interface VentasMetricas {
  totalVentasHoy: number;
  montoVentasHoy: number;
  ventasPendienteCobro: number;
  montoPendienteCobro: number;
  totalClientes: number;
  clientesConDeuda: number;
  ventasDelMes: number;
  montoDelMes: number;
}

/**
 * Filtros para ventas (state local del componente)
 */
export interface VentasFiltros {
  estadoPago?: EstadoPago;
  clienteId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}

/**
 * Filtros para terceros (state local del componente)
 */
export interface TercerosFiltros {
  tipo?: TipoTercero;
  conDeuda?: boolean;
  busqueda?: string;
}

/**
 * Item del carrito de venta (antes de confirmar)
 */
export interface CarritoItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stockDisponible: number;
}

/**
 * Estado del carrito de venta
 */
export interface CarritoVenta {
  items: CarritoItem[];
  clienteId: string | null;
  clienteNombre: string | null;
  subtotal: number;
  total: number;
  montoPagado: number;
  metodoPago: MetodoPago | null;
  cambio: number;
}

/**
 * Ordenamiento para tablas
 */
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  campo: string;
  direccion: SortDirection;
}

/**
 * Opciones para método de pago (para select)
 */
export interface MetodoPagoOption {
  value: MetodoPago;
  label: string;
  icon: string;
}

/**
 * Resumen de cuenta corriente de cliente
 */
export interface CuentaCorrienteResumen {
  clienteId: string;
  clienteNombre: string;
  saldoTotal: number;
  cantidadComprobantes: number;
  comprobantesAntiguos: number; // > 30 días
  ultimaCompra: Date | null;
}

// ============================================================================
// EXPORTACIÓN DE COBROS
// ============================================================================

/**
 * Información de la sesión de caja para exportación
 * Mapea a: backend/src/ventas/dto/exportar-cobros-response.dto.ts
 */
export interface SesionInfoDto {
  id: string;
  fechaApertura: Date;
  fechaConsulta: Date;
  estado: string; // 'ABIERTA'
}

/**
 * Cobro individual para exportación
 * Mapea a: backend/src/ventas/dto/exportar-cobros-response.dto.ts
 */
export interface CobroExportDto {
  id: string;
  fecha: Date;
  monto: number;
  metodo: MetodoPago;
  comprobante: {
    id: string;
    total: number;
  };
  cliente: {
    nombre: string;
  } | null;
}

/**
 * Resumen de cobros por método de pago
 * Mapea a: backend/src/ventas/dto/exportar-cobros-response.dto.ts
 */
export interface ResumenPorMetodoDto {
  EFECTIVO: number;
  QR: number;
  TARJETA: number;
  TRANSFERENCIA: number;
}

/**
 * Resumen general de cobros
 * Mapea a: backend/src/ventas/dto/exportar-cobros-response.dto.ts
 */
export interface ResumenCobrosDto {
  totalCobros: number;
  totalMonto: number;
  porMetodo: ResumenPorMetodoDto;
}

/**
 * Respuesta completa de exportación de cobros
 * Mapea a: backend/src/ventas/dto/exportar-cobros-response.dto.ts
 */
export interface ExportarCobrosResponseDto {
  sesion: SesionInfoDto;
  cobros: CobroExportDto[];
  resumen: ResumenCobrosDto;
}

// ============================================================================
// COTIZACIONES
// ============================================================================

/**
 * DTO para item de cotización
 * Mapea a: backend/src/ventas/cotizaciones/dto/item-cotizacion.dto.ts
 */
export interface ItemCotizacionDto {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * DTO para crear cotización
 * Mapea a: backend/src/ventas/cotizaciones/dto/crear-cotizacion.dto.ts
 */
export interface CrearCotizacionDto {
  clienteNombre: string; // Nombre del cliente (requerido)
  clienteId?: string; // UUID opcional - para vincular con tercero del sistema
  items: ItemCotizacionDto[];
  fechaEmision: Date;
}

/**
 * DTO para actualizar cotización
 */
export interface ActualizarCotizacionDto {
  clienteNombre?: string;
  clienteId?: string;
  items?: ItemCotizacionDto[];
}

/**
 * DTO para generar venta desde cotización
 * Mapea a: backend/src/ventas/cotizaciones/dto/generar-venta-desde-cotizacion.dto.ts
 */
export interface GenerarVentaDesdeCotizacionDto {
  montoPagado: number; // Monto pagado inicial (puede ser 0 para crédito)
  metodoPago?: MetodoPago; // Requerido si montoPagado > 0
}

/**
 * Query para listar cotizaciones
 */
export interface ListarCotizacionesQueryDto {
  fechaDesde?: string;
  fechaHasta?: string;
  clienteNombre?: string;
}

/**
 * Item de lista de cotizaciones
 */
export interface CotizacionListItemDto {
  id: string;
  numeroComprobante: string;
  clienteNombre: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  total: number;
  convertidaAVenta: boolean;
  createdAt: Date;
}

/**
 * Detalle completo de cotización
 */
export interface DetalleCotizacionResponseDto {
  id: string;
  numeroComprobante: string;
  clienteNombre: string;
  clienteId: string | null;
  fechaEmision: Date;
  fechaVencimiento: Date;
  items: {
    id: string;
    productoId: string;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
  usuarioEmisor: string;
  empresaNombre: string;
  createdAt: Date;
}

/**
 * Respuesta al crear/actualizar cotización
 */
export interface CotizacionResponseDto {
  cotizacion: DetalleCotizacionResponseDto;
  mensaje: string;
}

// ============================================================================
// ANULACIÓN DE VENTAS
// ============================================================================

/**
 * DTO para anular una venta
 * Mapea a: backend/src/ventas/dto/anular-venta.dto.ts
 */
export interface AnularVentaDto {
  motivoAnulacion: string; // Mínimo 10 caracteres, máximo 500
}

/**
 * Respuesta al anular una venta
 * Mapea a: backend/src/ventas/dto/anular-venta-response.dto.ts
 */
export interface AnularVentaResponseDto {
  comprobante: {
    id: string;
    total: number;
    estadoPago: string;
  };
  movimientoDevolucion: {
    id: string;
    monto: number;
    tipo: string;
    origen: string;
  } | null;
  productosRevertidos: number;
  saldoClienteAjustado: number | null;
  mensaje: string;
}
