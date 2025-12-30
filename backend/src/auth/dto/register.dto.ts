import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEmpresaDto } from '../../tenant/dto/create-empresa.dto';
import { CreateUsuarioDto } from '../../tenant/dto/create-usuario.dto';

export class RegisterDto {
  @ApiProperty({
    description: 'Datos de la empresa a registrar',
    type: CreateEmpresaDto,
  })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateEmpresaDto)
  empresa: CreateEmpresaDto;

  @ApiProperty({
    description:
      'Datos del usuario dueño (se creará como DUEÑO automáticamente)',
    type: CreateUsuarioDto,
  })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateUsuarioDto)
  usuario: CreateUsuarioDto;
}
