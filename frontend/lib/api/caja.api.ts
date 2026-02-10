import { BaseApiClient } from './base.api';
import type {
  AbrirCajaDto,
  CerrarCajaDto,
  RegistrarMovimientoDto,
  CajaSesion,
  MovimientoCaja,
  ReporteDiarioResponse,
} from '@/lib/types/caja.types';

/**
 * Cliente API para el módulo de Caja (Tesorería)
 *
 * Endpoints disponibles (Backend NestJS):
 * - GET  /caja/sesion-actual       - Obtener sesión activa
 * - POST /caja/abrir               - Abrir nueva sesión
 * - POST /caja/:id/cerrar          - Cerrar sesión específica
 * - POST /caja/movimientos         - Registrar movimiento manual
 * - GET  /caja/:id/movimientos     - Listar movimientos de sesión
 * - GET  /caja/reporte/diario      - Obtener reporte para PDF
 */
export class CajaApi extends BaseApiClient {
  private static readonly BASE_PATH = '/caja';

  // ==================== SESIÓN ====================

  /**
   * GET /caja/sesion-actual
   * Obtiene la sesión de caja activa actual (si existe)
   *
   * @returns CajaSesion | null
   * @throws ApiError si hay error de conexión o autenticación
   * @note Usa httpOnly cookies para autenticación
   */
  static async getSesionActual(): Promise<CajaSesion | null> {
    try {
      return await this.get<CajaSesion>(
        `${this.BASE_PATH}/sesion-actual`
      );
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      // Si no hay sesión activa, el backend puede retornar 404
      if (err.statusCode === 404) {
        return null;
      }
      // Errores de autenticación o autorización
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw new Error('No autorizado para acceder a la sesión de caja');
      }
      // Otros errores del servidor
      if (typeof err.statusCode === 'number' && err.statusCode >= 500) {
        throw new Error('Error del servidor al obtener sesión de caja');
      }
      throw err;
    }
  }

  /**
   * POST /caja/abrir
   * Abre una nueva sesión de caja
   *
   * @param data - Datos de apertura (montoInicial)
   * @returns CajaSesion creada
   * @throws ApiError si ya hay sesión abierta o datos inválidos
   * @note Usa httpOnly cookies para autenticación
   */
  static async abrirCaja(
    data: AbrirCajaDto
  ): Promise<CajaSesion> {
    return this.post<CajaSesion>(`${this.BASE_PATH}/abrir`, data);
  }

  /**
   * POST /caja/:id/cerrar
   * Cierra una sesión de caja específica (arqueo)
   *
   * @param sesionId - ID de la sesión a cerrar
   * @param data - Datos de cierre (montoRealEfectivo)
   * @returns CajaSesion cerrada con diferencia calculada
   * @throws ApiError si la sesión no existe o ya está cerrada
   * @note Usa httpOnly cookies para autenticación
   */
  static async cerrarCaja(
    sesionId: string,
    data: CerrarCajaDto
  ): Promise<CajaSesion> {
    return this.post<CajaSesion>(
      `${this.BASE_PATH}/${sesionId}/cerrar`,
      data
    );
  }

  // ==================== MOVIMIENTOS ====================

  /**
   * POST /caja/movimientos
   * Registra un movimiento manual en la caja (gasto, retiro, etc.)
   *
   * @param data - Datos del movimiento (tipo, origen, monto, metodoPago, descripcion)
   * @returns MovimientoCaja creado
   * @throws ApiError si no hay sesión abierta o datos inválidos
   * @note Usa httpOnly cookies para autenticación
   */
  static async registrarMovimiento(
    data: RegistrarMovimientoDto
  ): Promise<MovimientoCaja> {
    return this.post<MovimientoCaja>(
      `${this.BASE_PATH}/movimientos`,
      data
    );
  }

  /**
   * GET /caja/:id/movimientos
   * Lista todos los movimientos de una sesión específica
   *
   * @param sesionId - ID de la sesión
   * @returns Array de MovimientoCaja
   * @throws ApiError si la sesión no existe
   * @note Usa httpOnly cookies para autenticación
   */
  static async getMovimientos(
    sesionId: string
  ): Promise<MovimientoCaja[]> {
    return this.get<MovimientoCaja[]>(
      `${this.BASE_PATH}/${sesionId}/movimientos`
    );
  }

  // ==================== REPORTES ====================

  /**
   * GET /caja/reporte/diario?fecha=YYYY-MM-DD
   * Obtiene el reporte completo del día para generar PDF
   *
   * @param fecha - Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)
   * @returns Objeto con sesiones, movimientos y resumen del día
   * @throws ApiError si hay error
   * 
   * Nota: Usa httpOnly cookies para autenticación (no requiere token explícito)
   */
  static async getReporteDiario(
    fecha?: string
  ): Promise<ReporteDiarioResponse> {
    const queryParam = fecha ? `?fecha=${fecha}` : '';
    return this.get<ReporteDiarioResponse>(
      `${this.BASE_PATH}/reporte/diario${queryParam}`
    );
  }
}
