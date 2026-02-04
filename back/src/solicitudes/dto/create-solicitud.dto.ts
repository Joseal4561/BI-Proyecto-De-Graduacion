import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

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

  @IsEnum(['pendiente', 'en revision', 'aprobada', 'desaprobada', 'en proceso', 'completada'])
  @IsOptional()
  estado?: 'pendiente' | 'en revision' | 'aprobada' | 'desaprobada' | 'en proceso' | 'completada';
}