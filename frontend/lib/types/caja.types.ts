// ==================== ENUMERACIONES ====================

export enum EstadoCaja {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export enum TipoMovimiento {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

export enum OrigenMovimiento {
  APERTURA = 'APERTURA',
  VENTA = 'VENTA',
  GASTO = 'GASTO',
  RETIRO = 'RETIRO',
  DEPOSITO = 'DEPOSITO',
  DEVOLUCION = 'DEVOLUCION',
  AJUSTE = 'AJUSTE',
}

export enum MetodoPagoCaja {
  EFECTIVO = 'EFECTIVO',
  QR = 'QR',
  TRANSFERENCIA = 'TRANSFERENCIA',
  OTRO = 'OTRO',
}

// ==================== ENTIDADES ====================

// Mapea a: backend/src/caja/entities/caja-sesion.entity.ts
export interface CajaSesion {
  id: string;
  empresaId: string;
  montoInicial: number;
  montoFinalSistema: number;
  montoFinalReal: number | null;
  diferencia: number | null;
  fechaApertura: string; // ISO string
  fechaCierre: string | null; // ISO string
  estado: EstadoCaja;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
}

// Mapea a: backend/src/caja/entities/movimiento-caja.entity.ts
export interface MovimientoCaja {
  id: string;
  sesionId: string;
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  monto: number;
  metodoPago: MetodoPagoCaja;
  descripcion: string; // Descripción/concepto del movimiento
  fecha: string; // ISO string
  empresaId: string;
  comprobanteId: string | null; // ID del comprobante asociado (para ventas)
  createdAt: string;
  updatedAt: string;
}

// ==================== DTOs - PETICIONES ====================

// DTO para abrir nueva sesión de caja
export interface AbrirCajaDto {
  montoInicial: number; // Monto inicial en efectivo
}

// DTO para cerrar sesión (arqueo)
export interface CerrarCajaDto {
  montoRealEfectivo: number; // Monto real contado físicamente
}

// DTO para registrar movimiento manual
export interface RegistrarMovimientoDto {
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  monto: number;
  metodoPago: MetodoPagoCaja;
  descripcion: string; // Incluye concepto y referencia si aplica
}

// ==================== DTOs - RESPUESTAS ====================

export interface SesionActualResponse {
  sesion: CajaSesion | null;
  movimientos: MovimientoCaja[];
  totales: TotalesCajaResponse;
}

export interface TotalesCajaResponse {
  totalIngresos: number;
  totalEgresos: number;
  saldoEfectivo: number; // Solo efectivo
  saldoOtrosMetodos: number; // QR, Tarjeta, Transferencia
  saldoTotal: number; // Total del sistema
}

export interface ReporteDiarioResponse {
  sesion: CajaSesion;
  movimientos: MovimientoCaja[];
  totales: TotalesCajaResponse;
  resumenPorMetodo: ResumenMetodoPago[];
  horaGeneracion: string;
}

export interface ResumenMetodoPago {
  metodo: MetodoPagoCaja;
  totalIngresos: number;
  totalEgresos: number;
  saldo: number;
}

// ==================== TIPOS AUXILIARES UI ====================

export interface EstadoCajaUI {
  label: string;
  color: 'green' | 'gray';
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
}

export interface TipoMovimientoUI {
  label: string;
  color: 'green' | 'red';
  bgColor: string;
  textColor: string;
}

// ==================== MAPAS DE CONFIGURACIÓN UI ====================

export const ESTADO_CAJA_UI_MAP: Record<EstadoCaja, EstadoCajaUI> = {
  [EstadoCaja.ABIERTA]: {
    label: 'Abierta',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '🟢',
  },
  [EstadoCaja.CERRADA]: {
    label: 'Cerrada',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '🔴',
  },
};

export const TIPO_MOVIMIENTO_UI_MAP: Record<TipoMovimiento, TipoMovimientoUI> = {
  [TipoMovimiento.INGRESO]: {
    label: 'Ingreso',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  [TipoMovimiento.EGRESO]: {
    label: 'Egreso',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
};

export const METODO_PAGO_ICONS: Record<MetodoPagoCaja, string> = {
  [MetodoPagoCaja.EFECTIVO]: '💵',
  [MetodoPagoCaja.QR]: '📱',
  [MetodoPagoCaja.TRANSFERENCIA]: '🏦',
  [MetodoPagoCaja.OTRO]: '💳',
};

export const METODO_PAGO_LABELS: Record<MetodoPagoCaja, string> = {
  [MetodoPagoCaja.EFECTIVO]: 'Efectivo',
  [MetodoPagoCaja.QR]: 'QR',
  [MetodoPagoCaja.TRANSFERENCIA]: 'Transferencia',
  [MetodoPagoCaja.OTRO]: 'Otro',
};
