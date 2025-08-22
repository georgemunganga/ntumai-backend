import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter, ResponseInterceptor } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
          code: 'VALIDATION_ERROR'
        }));
        return {
          message: result,
          error: 'Bad Request',
          statusCode: 400,
        };
      },
    }),
  );
  
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
