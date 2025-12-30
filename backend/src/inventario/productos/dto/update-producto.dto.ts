import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

/**
 * DTO PARA ACTUALIZAR PRODUCTO
 *
 * Hace todos los campos opcionales.
 * Mantiene las validaciones del CreateDto cuando los campos están presentes.
 *
 * FUNCIONALIDAD ESPECIAL: Margen Inteligente
 * Si se envía precioCosto pero NO precioVenta, el servicio calculará
 * automáticamente el nuevo precioVenta manteniendo el margen actual.
 */
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}
