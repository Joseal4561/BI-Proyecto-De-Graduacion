import { PartialType } from '@nestjs/mapped-types';
import { CreateUserRankDto } from './create-user-rank.dto';
import { IsOptional, IsInt, IsEnum } from 'class-validator';

export class UpdateUserRankDto extends PartialType(CreateUserRankDto) {
  @IsOptional()
  @IsInt()
  userId?: number; // Though usually userId is not changed, it's kept optional by PartialType

  @IsOptional()
  @IsEnum(['Director', 'Coordinador', 'Administrador'])
  rank?: 'Director' | 'Coordinador' | 'Administrador';

  @IsOptional()
  @IsInt()
  escuelaId?: number;

  @IsOptional()
  @IsInt()
  municipioId?: number;
}