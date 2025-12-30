// IMPORTANTE: Este import DEBE estar PRIMERO para cargar las variables de entorno
// antes de que cualquier otro módulo las lea
import './load-env';

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig, validateConfig } from './common/config/app.config';

async function bootstrap() {
  // Validar configuración antes de iniciar
  validateConfig();

  const app = await NestFactory.create(AppModule);

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // SECURITY: Global serializer to exclude sensitive fields (like passwordHash)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS configuration
  app.enableCors({
    origin: AppConfig.cors.origin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant SaaS API')
    .setDescription(
      'API REST para sistema de gestión multi-tenant (Retail Simple)',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación y registro de usuarios')
    .addTag('Productos', 'Gestión de productos y categorías')
    .addTag('Terceros', 'Gestión de clientes y proveedores')
    .addTag('Comprobantes', 'Ventas')
    .addTag('Caja', 'Movimientos de caja y reportes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Retail Simple API Docs',
  });

  const port = AppConfig.port;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════════╗
  ║   Multi-Tenant SaaS Backend - RUNNING     ║
  ╠════════════════════════════════════════════╣
  ║  Server:    http://localhost:${port}       ║
  ║  Swagger:   http://localhost:${port}/api/docs ║
  ║  Database:  PostgreSQL (port 54320)       ║
  ╚════════════════════════════════════════════╝
  `);
}

// Execute bootstrap and handle any initialization errors
void bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
