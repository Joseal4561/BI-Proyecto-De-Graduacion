import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateEscuelaDto {
  @IsString()
  @IsOptional()
  codigoUdi?: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

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
  @IsNotEmpty()
  municipioId: number;

  @IsNumber()
  @IsNotEmpty()
  tipoId: number;

  @IsEnum(['monolingüe', 'bilingüe'])
  @IsOptional()
  modalidad?: 'monolingüe' | 'bilingüe';

  @IsString()
  @IsOptional()
  jornada?: string;
}