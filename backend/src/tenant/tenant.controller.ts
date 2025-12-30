import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
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
  @Roles(UsuarioRol.DUENO)
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
}
