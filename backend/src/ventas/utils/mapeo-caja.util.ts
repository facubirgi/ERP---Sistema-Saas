import { MetodoPago } from '../enums/metodo-pago.enum';
import { MetodoPagoCaja } from '../../caja/enums/metodo-pago.enum';

/**
 * UTILIDAD: Mapeo de Métodos de Pago entre Ventas y Caja
 *
 * Convierte los métodos de pago del módulo de Ventas al formato
 * requerido por el módulo de Caja.
 *
 * Mapeo:
 * - EFECTIVO → EFECTIVO
 * - QR → QR
 * - TARJETA → OTRO (Caja no distingue tarjetas específicamente)
 * - TRANSFERENCIA → TRANSFERENCIA
 *
 * @param metodoPago Método de pago del módulo de Ventas
 * @returns Método de pago compatible con módulo de Caja
 */
export function mapearMetodoPagoACaja(metodoPago: MetodoPago): MetodoPagoCaja {
  switch (metodoPago) {
    case MetodoPago.EFECTIVO:
      return MetodoPagoCaja.EFECTIVO;
    case MetodoPago.QR:
      return MetodoPagoCaja.QR;
    case MetodoPago.TARJETA:
      return MetodoPagoCaja.OTRO; // Tarjeta se mapea a OTRO en caja
    case MetodoPago.TRANSFERENCIA:
      return MetodoPagoCaja.TRANSFERENCIA;
    default:
      // TypeScript garantiza que esto nunca ocurra si el enum está completo
      throw new Error(`Método de pago no reconocido: ${String(metodoPago)}`);
  }
}
