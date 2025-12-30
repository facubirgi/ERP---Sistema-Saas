import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // SECURITY: 3 registrations per hour
  @ApiOperation({
    summary: 'Registrar nueva empresa y usuario dueño',
    description:
      'Crea una nueva empresa en el sistema y registra al usuario dueño. El primer usuario siempre tiene rol DUEÑO. LIMITADO: 3 registros por hora.',
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa y usuario creados exitosamente',
    schema: {
      example: {
        message: 'Registro exitoso',
        empresa: {
          id: 1,
          razonSocial: 'Kiosco El Buen Precio',
          email: 'contacto@kiosco.com',
        },
        usuario: {
          id: 1,
          nombre: 'Juan Pérez',
          email: 'juan@kiosco.com',
          rol: 'DUEÑO',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El email de la empresa ya está registrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Set httpOnly cookie with JWT token
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return response without token (accessToken is in HTTP-only cookie)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, ...response } = result;
    return response;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // SECURITY: 5 login attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica a un usuario y devuelve un token JWT. Requiere el email de la empresa y el email del usuario. LIMITADO: 5 intentos por minuto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        message: 'Login exitoso',
        empresa: {
          id: 1,
          razonSocial: 'Kiosco El Buen Precio',
          email: 'contacto@kiosco.com',
        },
        usuario: {
          id: 1,
          nombre: 'Juan Pérez',
          email: 'juan@kiosco.com',
          rol: 'DUEÑO',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o usuario inactivo',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set httpOnly cookie with JWT token
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return response without token (accessToken is in HTTP-only cookie)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, ...response } = result;
    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Elimina la cookie de autenticación del navegador',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    schema: {
      example: {
        message: 'Logout exitoso',
      },
    },
  })
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the httpOnly cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logout exitoso' };
  }
}
