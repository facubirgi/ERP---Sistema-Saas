import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  JwtPayload,
  AuthenticatedUser,
} from '../interfaces/jwt-payload.interface';

/**
 * JWT STRATEGY
 *
 * Validates JWT token signature and extracts payload.
 * Does NOT query the database to keep it stateless and respect Scope.REQUEST in other services.
 *
 * User validation (active status, empresa status) is handled by:
 * - TenantGuard: Validates empresaId
 * - Services with Scope.REQUEST: Can query user when needed
 *
 * The JWT signature itself provides authentication security.
 *
 * Token extraction:
 * - Primary: httpOnly cookie 'access_token'
 * - Fallback: Authorization Bearer header (for backward compatibility)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in config');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookie first (most secure)
        (request: Request): string | null => {
          return (request?.cookies?.access_token as string) || null;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // SECURITY: No fallback - jwt.config.ts validates secret exists and is strong
      secretOrKey: secret,
    });
  }

  /**
   * Validates the JWT payload.
   * This method is called AFTER Passport verifies the token signature.
   *
   * We trust the payload because:
   * 1. The token signature was verified (cannot be forged)
   * 2. The token hasn't expired
   * 3. Additional validations are done in guards/services
   *
   * @param payload - Decoded JWT payload
   * @returns User object injected into request.user
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // Return user object that will be attached to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      empresaId: payload.empresaId,
      rol: payload.rol as 'DUEÑO' | 'EMPLEADO',
      nombre: payload.nombre,
    };
  }
}
