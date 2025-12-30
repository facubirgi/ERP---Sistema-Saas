import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

interface RequestWithTenant extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}

/**
 * CRITICAL SECURITY INTERCEPTOR
 * Automatically injects tenant context into all authenticated requests
 *
 * This interceptor:
 * 1. Extracts the empresaId from the authenticated user (JWT payload)
 * 2. Injects it into the request object as `tenantId`
 * 3. Makes it available for services to use in database queries
 *
 * Usage: Apply globally in main.ts or per controller
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user;

    // Check if user is authenticated
    if (user && user.empresaId) {
      // Inject tenantId into request for use in services
      request.tenantId = user.empresaId;
    }

    return next.handle();
  }
}
