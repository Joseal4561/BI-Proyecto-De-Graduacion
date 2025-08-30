import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatosEducativosService } from './datos-educativos.serivce';
import { DatosEducativosController } from './datos-educativos.controller';
import { DatosEducativos } from '../entities/datos-educativos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DatosEducativos])],
  controllers: [DatosEducativosController],
  providers: [DatosEducativosService],
  exports: [DatosEducativosService],
})
export class DatosEducativosModule {}