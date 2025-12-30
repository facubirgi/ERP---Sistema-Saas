import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioRol } from '../../tenant/entities/usuario.entity';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

export const ROLES_KEY = 'roles';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UsuarioRol[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.rol) {
      throw new ForbiddenException('No se encontró información del usuario');
    }

    const hasRole = requiredRoles.includes(user.rol as UsuarioRol);

    if (!hasRole) {
      throw new ForbiddenException(
        'No tiene permisos suficientes para realizar esta acción',
      );
    }

    return true;
  }
}
