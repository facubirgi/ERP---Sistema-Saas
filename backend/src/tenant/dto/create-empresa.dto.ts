import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({
    description: 'Razón social de la empresa',
    example: 'Kiosco El Buen Precio',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razonSocial: string;

  @ApiProperty({
    description: 'CUIT de la empresa',
    example: '20-12345678-9',
    maxLength: 20,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  cuit?: string;

  @ApiProperty({
    description: 'Email de contacto de la empresa',
    example: 'contacto@kiosco.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+54 9 11 1234-5678',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @ApiProperty({
    description: 'Dirección física de la empresa',
    example: 'Av. Corrientes 1234, CABA',
    required: false,
  })
  @IsString()
  @IsOptional()
  direccion?: string;
}
