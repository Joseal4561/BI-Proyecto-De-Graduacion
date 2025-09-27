import { IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrediccionDto {
  feature1: number;
  feature2: number;
  feature3: number;
  feature4: number;
}

export class EnrollmentPredictionDto {
  cantidad_alumnos: number;
  numero_inscripciones: number;
  anio: number;
}

export class DropoutPredictionDto {
  cantidad_alumnos: number;
  numero_inscripciones: number;
  numero_maestros: number;
  promedio_calificaciones: number;
  es_urbana: boolean;
}

export class SavePrediccionDto {
  parametrosEntrada: any;
  resultadoPrediccion: any;
  usuarioId?: number;
}