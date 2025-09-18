import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscuelasService } from './escuelas.service';
import { EscuelasController } from './esculas.controller'
import { Escuela } from '../entities/escuela.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Escuela])],
  controllers: [EscuelasController],
  providers: [EscuelasService],
  exports: [EscuelasService],
})
export class EscuelasModule {}