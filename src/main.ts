import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Ntumai API - Auth Module')
    .setDescription(
      'Authentication API with OTP-first wizard flow. Supports email and phone-based authentication with JWT tokens.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'OTP-first authentication endpoints')
    .setContact('Ntumai Support', 'https://ntumai.com', 'support@ntumai.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Ntumai API Documentation',
    customfavIcon: 'https://ntumai.com/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}
    📚 Swagger documentation: http://localhost:${port}/api/docs
    🔐 Base API URL: http://localhost:${port}/api/v1
  `);
}
bootstrap();
