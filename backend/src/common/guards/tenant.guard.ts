import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

interface RequestWithTenant extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}

/**
 * CRITICAL SECURITY GUARD
 * Ensures that the empresaId in the JWT matches the empresaId in the request
 * This prevents cross-tenant data access
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, TenantGuard)
 *
 * The guard checks if:
 * 1. User is authenticated (empresaId exists in JWT)
 * 2. If empresaId is provided in request body/params, it matches the JWT empresaId
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user;

    // User should be authenticated at this point (via JwtAuthGuard)
    if (!user || !user.empresaId) {
      throw new ForbiddenException(
        'Tenant ID no encontrado. Usuario no autenticado correctamente.',
      );
    }

    // Extract empresaId from various sources in the request
    const requestEmpresaId =
      request.body?.empresaId ||
      request.params?.empresaId ||
      request.query?.empresaId;

    // If empresaId is explicitly provided in the request, verify it matches the JWT
    if (requestEmpresaId) {
      // UUID validation (basic check - 36 characters with hyphens)
      if (
        typeof requestEmpresaId !== 'string' ||
        requestEmpresaId.length !== 36
      ) {
        throw new BadRequestException('Empresa ID inválido (debe ser UUID)');
      }

      if (requestEmpresaId !== user.empresaId) {
        throw new ForbiddenException(
          'Acceso denegado: no tiene permisos para acceder a esta empresa',
        );
      }
    }

    // Inject empresaId into request for use in controllers/services
    request.tenantId = user.empresaId;

    return true;
  }
}
