import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Usuario } from './entities/usuario.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, Usuario])],
  controllers: [TenantController],
  providers: [TenantService, RolesGuard],
  exports: [TenantService, TypeOrmModule],
})
export class TenantModule {}
