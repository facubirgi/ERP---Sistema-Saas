import { IsEmail, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsuarioDto {
  @ApiProperty({ description: 'Nombre completo del usuario', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @ApiProperty({ description: 'Email del usuario', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}
