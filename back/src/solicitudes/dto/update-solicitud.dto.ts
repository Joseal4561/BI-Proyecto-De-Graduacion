import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicitudDto } from './create-solicitud.dto';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSolicitudDto extends PartialType(CreateSolicitudDto) {
  @IsNumber()
  @IsOptional()
  escuelaId?: number;

  @IsNumber()
  @IsOptional()
  necesidadEscritorios?: number;

  @IsNumber()
  @IsOptional()
  necesidadMesasHexagonales?: number;

  @IsNumber()
  @IsOptional()
  necesidadPizarras?: number;

  @IsNumber()
  @IsOptional()
  necesidadCatedras?: number;

  @IsString()
  @IsOptional()
  fecha_Reporte?: string;
}