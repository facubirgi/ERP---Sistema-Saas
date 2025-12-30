import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email de la empresa (identificador del tenant)',
    example: 'contacto@kiosco.com',
  })
  @IsEmail()
  @IsNotEmpty()
  empresaEmail: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan@kiosco.com',
  })
  @IsEmail()
  @IsNotEmpty()
  usuarioEmail: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
