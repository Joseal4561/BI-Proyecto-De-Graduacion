import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateEscuelaDto {
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
}