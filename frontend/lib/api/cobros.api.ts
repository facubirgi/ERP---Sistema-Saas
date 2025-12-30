// ============================================================================
// COBROS API CLIENT - Sistema SaaS
// ============================================================================
// Cliente para interactuar con endpoints de cobros (pagos)
// Base URL: /api/ventas/cobros

import { BaseApiClient } from './base.api';
import type {
  RegistrarCobroDto,
  ActualizarCobroDto,
  CobroResponseDto,
} from '@/lib/types/ventas.types';

/**
 * Cliente API para gestión de cobros
 * Auth: JWT en cookie httpOnly (automático con credentials: 'include')
 * El backend automáticamente filtra por empresaId del token
 */
export class CobrosApi extends BaseApiClient {
  private static readonly BASE_PATH = '/ventas/cobros';

  /**
   * Registrar un cobro diferido
   * POST /api/ventas/cobros
   *
   * Validaciones:
   * - Comprobante debe existir
   * - No debe estar completamente pagado (estadoPago !== PAGADO)
   * - Monto no debe exceder saldoPendiente
   * - Monto debe ser > 0
   *
   * Operaciones atómicas:
   * - Crea registro de cobro
   * - Actualiza saldoPendiente del comprobante
   * - Actualiza estadoPago del comprobante (PENDIENTE → PARCIAL → PAGADO)
   * - Actualiza saldoActual del tercero (si tiene cliente asociado)
   *
   * @param data - Datos del cobro
   * @returns Respuesta con cobro registrado y estado actualizado del comprobante
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async create(data: RegistrarCobroDto): Promise<CobroResponseDto> {
    return this.post<CobroResponseDto>(this.BASE_PATH, data);
  }

  /**
   * Actualizar un cobro
   * PATCH /api/ventas/cobros/:id
   *
   * Campos actualizables:
   * - metodoPago: Corregir método de pago capturado incorrectamente
   * - fecha: Ajustar fecha del cobro (ISO 8601)
   *
   * IMPORTANTE:
   * - NO se puede actualizar el monto del cobro
   * - Para cambiar montos, se debe crear un nuevo cobro o revertir
   *
   * Casos de uso:
   * - Corregir método de pago (se ingresó QR pero fue EFECTIVO)
   * - Ajustar fecha de cobro
   *
   * @param id - UUID del cobro
   * @param data - Datos a actualizar
   * @returns Respuesta con cobro actualizado
   * @note Auth: JWT en cookie httpOnly (automático)
   */
  static async update(id: string, data: ActualizarCobroDto): Promise<CobroResponseDto> {
    return this.patch<CobroResponseDto>(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * NOTA SOBRE ELIMINACIÓN DE COBROS:
   *
   * Los cobros NO se eliminan mediante DELETE. En su lugar:
   *
   * - Para revertir un cobro, se crea un cobro con monto NEGATIVO
   * - Esto preserva el historial completo de movimientos
   * - Mantiene la integridad del audit trail
   *
   * Ejemplo de reversión:
   * ```typescript
   * // Cobro original: +$100
   * await CobrosApi.create(token, {
   *   comprobanteId: 'xxx',
   *   monto: 100,
   *   metodoPago: MetodoPago.EFECTIVO
   * });
   *
   * // Reversión: -$100
   * await CobrosApi.create(token, {
   *   comprobanteId: 'xxx',
   *   monto: -100,
   *   metodoPago: MetodoPago.EFECTIVO
   * });
   * ```
   */
}
