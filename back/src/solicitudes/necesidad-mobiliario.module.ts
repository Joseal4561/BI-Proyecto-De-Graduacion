import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NecesidadMobiliarioService } from './necesidad-mobiliario.service';
import { NecesidadMobiliarioController } from './necesidad-mobiliario.controller';
import { NecesidadMobiliario } from '../entities/solicitud.entity';
import { EscuelaModule } from '../escuelas/escuelas.module';
import { UserRankModule } from '../user-rank/user-rank.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NecesidadMobiliario]),
    EscuelaModule,
    UserRankModule,
  ],
  controllers: [NecesidadMobiliarioController],
  providers: [NecesidadMobiliarioService],
  exports: [NecesidadMobiliarioService],
})
export class NecesidadMobiliarioModule {}