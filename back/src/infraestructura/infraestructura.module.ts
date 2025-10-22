import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfraestructuraEscolarService } from './infraestructura.service';
import { InfraestructuraEscolarController } from './infraestructura.controller';
import { InfraestructuraEscolar } from '../entities/infraestructura.entity';
import { EscuelaModule } from '../escuelas/escuelas.module';
import { NecesidadMobiliarioModule } from '../solicitudes/necesidad-mobiliario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfraestructuraEscolar]),
    EscuelaModule,
    NecesidadMobiliarioModule,
  ],
  controllers: [InfraestructuraEscolarController],
  providers: [InfraestructuraEscolarService],
  exports: [InfraestructuraEscolarService],
})
export class InfraestructuraEscolarModule {}