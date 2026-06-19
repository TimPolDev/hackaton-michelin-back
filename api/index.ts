import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Enable CORS for frontend (supporte plusieurs URLs en production)
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000'];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // API prefix
    app.setGlobalPrefix('api/v1');

    await app.init();
  }
  return app;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const server = await bootstrap();
  const instance = server.getHttpAdapter().getInstance();
  return instance(req, res);
};
