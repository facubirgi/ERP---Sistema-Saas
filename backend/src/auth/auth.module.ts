import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TenantModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') || '1h';

        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        // Validar que expiresIn tenga un formato válido
        const validTimeFormats = /^(\d+[smhdwy]?|\d+)$/;
        if (!validTimeFormats.test(expiresIn)) {
          throw new Error(`Invalid JWT expires format: ${expiresIn}`);
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          } as JwtSignOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
