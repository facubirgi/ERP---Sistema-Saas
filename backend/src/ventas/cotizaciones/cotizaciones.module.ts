import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { Comprobante } from '../entities/comprobante.entity';
import { ComprobanteDetalle } from '../entities/comprobante-detalle.entity';
import { Tercero } from '../entities/tercero.entity';
import { VentasModule } from '../ventas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comprobante, ComprobanteDetalle, Tercero]),
    forwardRef(() => VentasModule),
  ],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}
