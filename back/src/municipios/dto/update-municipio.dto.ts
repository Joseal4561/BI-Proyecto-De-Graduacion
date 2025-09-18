import { PartialType } from '@nestjs/mapped-types';
import { CreateMunicipioDto } from './create-municipio.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateMunicipioDto extends PartialType(CreateMunicipioDto) {
     @IsString()
  @IsNotEmpty()
  nombre: string;
}