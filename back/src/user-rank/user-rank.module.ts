import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRankService } from './user-rank.service';
import { UserRankController } from './user-rank.controller';
import { UserRank } from '../entities/user-rank.entity';
import { User } from '../entities/user.entity';
import { Escuela } from '../entities/escuela.entity';
import { Municipio } from '../entities/municipio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRank, User, Escuela, Municipio])],
  controllers: [UserRankController],
  providers: [UserRankService],
  exports: [UserRankService],
})
export class UserRankModule {}