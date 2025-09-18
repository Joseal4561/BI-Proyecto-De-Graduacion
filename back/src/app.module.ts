import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DatosEducativosModule } from './datos-educativos/datos-educativos.module';
import { EscuelasModule } from './escuelas/escuelas.module';
import { UserModule } from './user/user.module';
import { User } from './entities/user.entity';
import { Escuela } from './entities/escuela.entity';
import { DatosEducativos } from './entities/datos-educativos.entity';
import { TipoEscuela } from './entities/tipo-escuela.entity';
import { Municipio } from './entities/municipio.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'mysql',
        host: 'localhost',
        port: 3309,
        username: 'root',
        password: 'root',
        database: 'db_educacion',
        entities: [User, Escuela, DatosEducativos, TipoEscuela, Municipio],
        synchronize: false, 
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DatosEducativosModule,
    EscuelasModule,
    UserModule,
  ],
})
export class AppModule {}