import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoEscuelaDto } from './create-tipo-escuela.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateTipoEscuelaDto extends PartialType(CreateTipoEscuelaDto) {
    @IsString()
      @IsNotEmpty()
      nombre: string;
}