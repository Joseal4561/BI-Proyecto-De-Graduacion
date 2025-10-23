import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateSolicitudDto {
  @IsNumber()
  @IsNotEmpty()
  escuelaId: number;

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