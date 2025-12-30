import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Scope,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * AUTH SERVICE
 *
 * Servicio con Scope.REQUEST para autenticación y registro.
 * No requiere tenant context ya que maneja operaciones públicas (login/register).
 */
@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    private tenantService: TenantService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new empresa with owner usuario
   */
  async register(registerDto: RegisterDto) {
    try {
      const { empresa, usuario } =
        await this.tenantService.registerEmpresaWithOwner(
          registerDto.empresa,
          registerDto.usuario,
        );

      // Generate JWT token
      const token = this.generateToken(
        usuario.id,
        usuario.email,
        empresa.id,
        usuario.rol,
        usuario.nombre,
      );

      return {
        message: 'Registro exitoso',
        empresa: {
          id: empresa.id,
          razonSocial: empresa.razonSocial,
          email: empresa.email,
        },
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
        accessToken: token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error('Error durante el registro: ' + errorMessage);
    }
  }

  /**
   * Login usuario
   */
  async login(loginDto: LoginDto) {
    // 1. Find empresa by email
    const empresa = await this.tenantService.findEmpresaByEmail(
      loginDto.empresaEmail,
    );
    if (!empresa) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Find usuario by email within that empresa
    const usuario = await this.tenantService.findUsuarioByEmail(
      loginDto.usuarioEmail,
      empresa.id,
    );

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Verify usuario is active
    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // 4. Verify password
    const isPasswordValid = await this.tenantService.verifyPassword(
      loginDto.password,
      usuario.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. Generate JWT token
    const token = this.generateToken(
      usuario.id,
      usuario.email,
      empresa.id,
      usuario.rol,
      usuario.nombre,
    );

    return {
      message: 'Login exitoso',
      empresa: {
        id: empresa.id,
        razonSocial: empresa.razonSocial,
        email: empresa.email,
      },
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      accessToken: token,
    };
  }

  /**
   * Generate JWT access token
   */
  private generateToken(
    usuarioId: string,
    email: string,
    empresaId: string,
    rol: string,
    nombre: string,
  ): string {
    const payload: JwtPayload = {
      sub: usuarioId,
      email,
      empresaId, // CRITICAL: Include tenant ID in JWT
      rol,
      nombre,
    };

    return this.jwtService.sign(payload);
  }
}
