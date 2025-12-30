import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tercero } from '../entities/tercero.entity';
import { TercerosController } from './terceros.controller';
import { TercerosService } from './terceros.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tercero])],
  controllers: [TercerosController],
  providers: [TercerosService],
  exports: [TercerosService], // Para que otros módulos puedan usarlo
})
export class TercerosModule {}
