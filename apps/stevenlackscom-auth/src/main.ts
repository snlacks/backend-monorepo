import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'debug', 'error', 'verbose', 'warn']
        : ['error', 'warn'],
  });

  const corsOptions = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    origin: function (origin, callback) {
      const match = [
        'http://localhost:3001',
        'https://demo.stevenlacks.com',
      ].includes(origin);
      callback(null, match);
    },
    allowedHeaders: ['content-type', 'access-control-allow-origin'],
    credentials: true,
  };
  app.enableCors(corsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: process.env.NODE_ENV === 'production',
      transform: true,
    }),
  );

  app.use(cookieParser());

  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
