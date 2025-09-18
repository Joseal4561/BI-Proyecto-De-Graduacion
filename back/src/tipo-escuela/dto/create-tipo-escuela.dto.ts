import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTipoEscuelaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}