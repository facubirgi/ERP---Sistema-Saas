import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioRol } from './entities/usuario.entity';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Tenant')
@Controller('tenant')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('usuarios')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo usuario (empleado) en la empresa',
    description:
      'Permite al DUEÑO crear nuevos usuarios (empleados) para su empresa. El rol del usuario se toma del DTO enviado.',
  })
  @ApiBody({
    type: CreateUsuarioDto,
    examples: {
      empleado: {
        summary: 'Crear empleado',
        value: {
          nombre: 'Juan Pérez',
          email: 'juan.perez@example.com',
          password: 'Password123!',
          rol: 'EMPLEADO',
        },
      },
      dueno: {
        summary: 'Crear otro dueño',
        value: {
          nombre: 'María González',
          email: 'maria.gonzalez@example.com',
          password: 'Password123!',
          rol: 'DUEÑO',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        message: 'Usuario creado exitosamente',
        usuario: {
          id: 2,
          empresaId: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@example.com',
          rol: 'EMPLEADO',
          activo: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email duplicado',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo el DUEÑO puede crear usuarios',
  })
  async createUsuario(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @Request() req: RequestWithUser,
  ) {
    const empresaId = req.user.empresaId;
    const usuario = await this.tenantService.createUsuario(
      createUsuarioDto,
      empresaId,
    );

    return {
      message: 'Usuario creado exitosamente',
      usuario: {
        id: usuario.id,
        empresaId: usuario.empresaId,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    };
  }

  @Get('usuarios/estadisticas')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({ summary: 'Estadísticas de usuarios por rol' })
  @ApiResponse({ status: 200, description: 'Estadísticas de usuarios' })
  @ApiResponse({ status: 403, description: 'Solo el DUEÑO puede ver estadísticas' })
  async estadisticasUsuarios(@Request() req: RequestWithUser) {
    return this.tenantService.contarUsuariosPorRol(req.user.empresaId);
  }

  @Get('usuarios')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 403, description: 'Solo el DUEÑO puede listar usuarios' })
  async listarUsuarios(@Request() req: RequestWithUser) {
    return this.tenantService.listarUsuarios(req.user.empresaId);
  }

  @Patch('usuarios/:id')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({ summary: 'Actualizar usuario (nombre y email)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya en uso' })
  async actualizarUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @Request() req: RequestWithUser,
  ) {
    const usuario = await this.tenantService.actualizarUsuario(
      id,
      dto,
      req.user.empresaId,
    );

    return {
      message: 'Usuario actualizado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    };
  }

  @Post('usuarios/:id/cambiar-password')
  @Roles(UsuarioRol.DUENO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async cambiarPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarPasswordDto,
    @Request() req: RequestWithUser,
  ) {
    await this.tenantService.cambiarPassword(
      id,
      dto.nuevaPassword,
      req.user.empresaId,
    );

    return { message: 'Contraseña actualizada exitosamente' };
  }

  @Patch('usuarios/:id/toggle-activo')
  @Roles(UsuarioRol.DUENO)
  @ApiOperation({ summary: 'Activar o desactivar usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  @ApiResponse({ status: 400, description: 'No se puede desactivar al único dueño' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async toggleActivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    const usuario = await this.tenantService.toggleActivoUsuario(
      id,
      req.user.empresaId,
    );

    return {
      message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        activo: usuario.activo,
      },
    };
  }
}
