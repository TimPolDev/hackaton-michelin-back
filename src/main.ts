import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 3001;

  // En développement local, écouter sur un port
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}/api/v1`);
  } else {
    // En production Vercel, initialiser l'app sans listen
    await app.init();
    console.log('🚀 Backend initialized for serverless');
  }

  return app;
}

// Export pour Vercel serverless
let cachedApp;
export default async (req, res) => {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  return cachedApp.getHttpAdapter().getInstance()(req, res);
};

// Bootstrap local
if (require.main === module) {
  bootstrap();
}
