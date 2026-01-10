import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { CategoriasModule } from './inventario/categorias/categorias.module';
import { ProductosModule } from './inventario/productos/productos.module';
import { VentasModule } from './ventas/ventas.module';
import { TercerosModule } from './ventas/terceros/terceros.module';
import { CajaModule } from './caja/caja.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // SECURITY: Rate Limiting to prevent brute force attacks
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // Generous limit for development
      },
    ]),

    // TypeORM Database Module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<Record<string, unknown>>('database');
        return { ...(dbConfig || {}) };
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    TenantModule,
    AuthModule,

    // Inventario Modules
    CategoriasModule,
    ProductosModule,

    // Ventas Modules
    VentasModule,
    TercerosModule,

    // Caja Module (Tesorería)
    CajaModule,

    // Analytics Module (Dashboard)
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // SECURITY: Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
