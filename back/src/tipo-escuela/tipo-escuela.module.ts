import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoEscuelaController } from './tipo-escuela.controller';
import { TipoEscuelaService } from './tipo-escuela.service';
import { TipoEscuela } from '../entities/tipo-escuela.entity';


@Module({
  imports: [TypeOrmModule.forFeature([TipoEscuela])],
  controllers: [TipoEscuelaController],
  providers: [TipoEscuelaService],
  exports: [TipoEscuelaService],
})
export class TipoEscuelaModule {}