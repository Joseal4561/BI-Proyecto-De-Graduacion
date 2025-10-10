import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DatosEducativosModule } from './datos-educativos/datos-educativos.module';
import { EscuelaModule } from './escuelas/escuelas.module';
import { TipoEscuelaModule } from './tipo-escuela/tipo-escuela.module';
import { MunicipioModule } from './municipios/municipio.module';
import { UserModule } from './user/user.module';
import { User } from './entities/user.entity';
import { Escuela } from './entities/escuela.entity';
import { DatosEducativos } from './entities/datos-educativos.entity';
import { TipoEscuela } from './entities/tipo-escuela.entity';
import { Municipio } from './entities/municipio.entity';
import { PrediccionIA } from './entities/ai.entity';
import { PrediccionesIaModule } from './ai/predicciones-ia.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mongodb' | 'oracle' | 'mssql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '3306', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, Escuela, DatosEducativos, TipoEscuela, Municipio, PrediccionIA],
        synchronize: false, 
      }),
     
    }),
    AuthModule,
    DatosEducativosModule,
    EscuelaModule,
    UserModule,
    TipoEscuelaModule,
    MunicipioModule,
    PrediccionesIaModule
  ],
})
export class AppModule {}