import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMunicipioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}