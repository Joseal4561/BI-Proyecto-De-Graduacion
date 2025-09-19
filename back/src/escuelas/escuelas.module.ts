import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscuelaService } from './escuelas.service';
import { EscuelaController } from './esculas.controller';
import { MunicipioModule } from '../municipios/municipio.module';
import { Escuela } from '../entities/escuela.entity';
import { TipoEscuelaModule } from '../tipo-escuela/tipo-escuela.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Escuela]),
    MunicipioModule, 
    TipoEscuelaModule, 
  ],
  controllers: [EscuelaController],
  providers: [EscuelaService],
  exports: [EscuelaService], 
})
export class EscuelaModule {}