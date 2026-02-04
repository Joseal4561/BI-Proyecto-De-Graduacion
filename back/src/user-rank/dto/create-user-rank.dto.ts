import { IsNotEmpty, IsNumber, IsOptional, IsEnum, IsInt } from 'class-validator';

export class CreateUserRankDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsEnum(['Director', 'Coordinador', 'Administrador'])
  @IsNotEmpty()
  rank: 'Director' | 'Coordinador' | 'Administrador';

  @IsInt()
  @IsOptional()
  escuelaId?: number;

  @IsInt()
  @IsOptional()
  municipioId?: number;
}