import { PartialType } from '@nestjs/mapped-types';
import { CreateEscuelaDto } from './create-escuela.dto';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateEscuelaDto extends PartialType(CreateEscuelaDto) {
  @IsString()
  @IsOptional()
  codigoUdi?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  fecha_Fundacion?: string;

  @IsNumber()
  @IsOptional()
  municipioId?: number;

  @IsNumber()
  @IsOptional()
  tipoId?: number;

  @IsEnum(['monolingüe', 'bilingüe'])
  @IsOptional()
  modalidad?: 'monolingüe' | 'bilingüe';

  @IsString()
  @IsOptional()
  jornada?: string;
}