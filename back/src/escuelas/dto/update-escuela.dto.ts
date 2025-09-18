import { PartialType } from '@nestjs/mapped-types';
import { CreateEscuelaDto } from './create-escuela.dto';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateEscuelaDto extends PartialType(CreateEscuelaDto) {
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