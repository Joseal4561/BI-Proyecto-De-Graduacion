import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDatosEducativosDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  escuelaId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  anio: number;

  @IsNotEmpty()
  @IsEnum(['1', '2'])
  semestre: '1' | '2';

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cantidadAlumnos: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numeroInscripciones: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tasaDesercion: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tasaPromocion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numeroMaestros?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  promedioCalificaciones?: number;

  @IsOptional()
  @IsBoolean()
  esUrbana?: boolean;
}

export class UpdateDatosEducativosDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  escuelaId?: number;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  anio?: number;

  @IsOptional()
  @IsEnum(['1', '2'])
  semestre?: '1' | '2';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cantidadAlumnos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numeroInscripciones?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tasaDesercion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tasaPromocion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  numeroMaestros?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  promedioCalificaciones?: number;

  @IsOptional()
  @IsBoolean()
  esUrbana?: boolean;
}