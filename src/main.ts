import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Paceline By Michelin API')
    .setDescription(
      [
        'API REST de Paceline By Michelin.',
        '',
        'Toutes les routes sont préfixées par `/api/v1`.',
        '',
        '**Authentification** : la plupart des routes nécessitent un JWT Supabase',
        'passé dans le header `Authorization: Bearer <token>`. Les routes marquées',
        '« public » sont accessibles sans authentification. Les routes marquées',
        '« admin » nécessitent en plus un compte avec `isAdmin = true`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Supabase (access token)',
      },
      'supabase-jwt',
    )
    .addTag('Auth', 'Authentification et gestion du profil utilisateur')
    .addTag('Cyclists', 'Profils cyclistes, statistiques et classement')
    .addTag('Activities', 'Activités cyclistes et intégration Strava')
    .addTag('Tires', 'Catalogue des pneus Michelin')
    .addTag('Recommendations', 'Recommandations de pneus personnalisées')
    .addTag('Clubs', 'Clubs, membres, invitations et fil d’actualité')
    .addTag('Events', 'Événements et sorties de club')
    .addTag('Ambassadors', 'Ambassadeurs Michelin et leurs parcours')
    .addTag('Resellers', 'Revendeurs / points de vente')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;

  // En développement local, écouter sur un port
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}/api/v1`);
    console.log(`📚 Swagger docs on http://localhost:${port}/api/v1/docs`);
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
