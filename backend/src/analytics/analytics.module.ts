import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Comprobante } from '../ventas/entities/comprobante.entity';
import { Cobro } from '../ventas/entities/cobro.entity';
import { Tercero } from '../ventas/entities/tercero.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';

/**
 * MODULE: Analytics
 *
 * Módulo de analíticas y métricas para el dashboard.
 *
 * Funcionalidades:
 * - Ventas mensuales (últimos N meses)
 * - Comparativa mensual (mes actual vs mes anterior)
 * - Cuentas por cobrar (clientes morosos)
 * - Stock crítico (productos bajo stock mínimo)
 *
 * Seguridad:
 * - Todos los endpoints requieren autenticación JWT
 * - Aislamiento multi-tenant por empresaId
 * - Guards: JwtAuthGuard + TenantGuard
 *
 * Performance:
 * - Queries optimizadas con agregaciones en BD
 * - Uso de índices existentes
 * - Objetivo: < 500ms por endpoint
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comprobante,
      Cobro,
      Tercero,
      Producto,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
