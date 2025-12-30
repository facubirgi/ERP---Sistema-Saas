import { Comprobante } from '../../entities/comprobante.entity';

/**
 * DTO de respuesta al crear una cotización
 */
export class CotizacionResponseDto {
  cotizacion: Comprobante;
  mensaje: string;

  constructor(cotizacion: Comprobante, mensaje: string) {
    this.cotizacion = cotizacion;
    this.mensaje = mensaje;
  }
}
