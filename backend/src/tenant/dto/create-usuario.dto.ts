import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsuarioRol } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  // SECURITY: empresaId is NEVER accepted from client
  // It is ALWAYS taken from the authenticated user's JWT token
  // This prevents users from creating employees in other companies

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Email del usuario (único por empresa)',
    example: 'juan@kiosco.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: UsuarioRol,
    example: UsuarioRol.EMPLEADO,
    required: false,
  })
  @IsEnum(UsuarioRol)
  @IsOptional()
  rol?: UsuarioRol;
}
