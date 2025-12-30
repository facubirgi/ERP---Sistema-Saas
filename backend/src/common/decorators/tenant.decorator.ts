import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: AuthenticatedUser;
}

/**
 * Custom decorator to extract the current tenant ID from the request
 * This decorator reads the tenantId that was set by TenantGuard
 *
 * IMPORTANT: Requires @UseGuards(JwtAuthGuard, TenantGuard) on the controller/endpoint
 *
 * Usage: @CurrentTenant() empresaId: string
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(
        'Tenant ID no encontrado en request. Asegúrate de usar @UseGuards(JwtAuthGuard, TenantGuard) en el controller.',
      );
    }

    return tenantId;
  },
);

/**
 * Custom decorator to extract the current user from the request
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.user;
  },
);
