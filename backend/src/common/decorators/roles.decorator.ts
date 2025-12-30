import { SetMetadata } from '@nestjs/common';
import { UsuarioRol } from '../../tenant/entities/usuario.entity';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: UsuarioRol[]) => SetMetadata(ROLES_KEY, roles);
