import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrediccionesIaController } from './predicciones-ia.controller';
import { PrediccionesIaService } from './predicciones-ia.service';
import { AiService } from './ai.service';
import { PrediccionIA } from 'src/entities/ai.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrediccionIA])],
  controllers: [PrediccionesIaController],
  providers: [PrediccionesIaService, AiService],
})
export class PrediccionesIaModule {}