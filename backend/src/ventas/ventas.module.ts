import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';
import { Tercero } from './entities/tercero.entity';
import { Comprobante } from './entities/comprobante.entity';
import { ComprobanteDetalle } from './entities/comprobante-detalle.entity';
import { Cobro } from './entities/cobro.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { CajaModule } from '../caja/caja.module';
import { TercerosModule } from './terceros/terceros.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';

/**
 * MODULE: Ventas, Cobros y Cotizaciones
 *
 * Módulo de feature que gestiona todo el ciclo de ventas, cobros y cotizaciones.
 *
 * Funcionalidades:
 * - Registro de ventas (con cliente o anónimas)
 * - Gestión de cobros (iniciales y diferidos)
 * - Cotizaciones (presupuestos sin afectar stock)
 * - Control de saldos pendientes
 * - Sincronización de saldos de terceros
 * - Integración automática con módulo de Caja para registrar movimientos
 *
 * Estructura:
 * - VentasController y VentasService (ventas y cobros)
 * - TercerosModule (clientes y proveedores)
 * - CotizacionesModule (presupuestos)
 *
 * Integración con Caja:
 * - Importa CajaModule para acceso a CajaService
 * - Los cobros se registran automáticamente como movimientos de caja
 *
 * Exporta:
 * - VentasService (para uso en otros módulos)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tercero,
      Comprobante,
      ComprobanteDetalle,
      Cobro,
      Producto, // Necesario para validar productos en ventas
    ]),
    CajaModule, // Importar para acceso a CajaService
    TercerosModule, // Sub-módulo de terceros
    CotizacionesModule, // Sub-módulo de cotizaciones
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
