import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';
import { CajaSesion } from './entities/caja-sesion.entity';
import { MovimientoCaja } from './entities/movimiento-caja.entity';

/**
 * MÓDULO DE CAJA (TESORERÍA)
 *
 * Gestiona el sistema de caja del punto de venta.
 *
 * Funcionalidades:
 * - Apertura y cierre de sesiones de caja
 * - Registro de movimientos (ingresos/egresos)
 * - Control de arqueo (diferencias de caja)
 * - Reportes diarios
 * - Multi-tenant automático
 * - Solo una sesión abierta por empresa a la vez
 *
 * Integración:
 * - Exporta CajaService para uso del módulo de Ventas
 * - Los cobros de ventas deben registrarse automáticamente en caja
 */
@Module({
  imports: [TypeOrmModule.forFeature([CajaSesion, MovimientoCaja])],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService], // Exportar para que Ventas pueda inyectarlo
})
export class CajaModule {}
