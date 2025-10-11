import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: ['error', 'warn', 'log', 'debug', 'verbose'],});

  app.enableCors({
    origin: [ 
        'https://localhost:4000',
        'https://carta.hopitalbarillas.cloud:4000',
        'https://carta.hopitalbarillas.cloud'  
    ], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });


  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));



  await app.listen(3004);
  console.log('Backend running on http://localhost:3004');
}
bootstrap();
