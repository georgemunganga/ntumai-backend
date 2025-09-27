import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, ResponseInterceptor } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
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
  
  // Global exception filter and interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('NTUMAI API')
    .setDescription(`
      NTUMAI Backend API Documentation - Domain-Driven Design Architecture
      
      This API provides comprehensive endpoints for the NTUMAI platform, including:
      - User authentication and authorization
      - Marketplace and product management
      - Order processing and delivery tracking
      - Real-time chat and notifications
      - Payment processing and loyalty programs
      - Administrative functions
      
      Built with NestJS, PostgreSQL, and Prisma ORM.
    `)
    .setVersion('1.0.0')
    .setContact('NTUMAI Development Team', 'https://ntumai.com', 'dev@ntumai.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (without Bearer prefix)',
        in: 'header',
      },
      'JWT-auth',
    )
<<<<<<< HEAD
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile endpoints')
    .addTag('Admin', 'Administrative functions and management')
    .addTag('Marketplace', 'Marketplace discovery and browsing endpoints')
    .addServer(process.env.API_BASE_URL || 'http://localhost:3000', 'Development server')
=======
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'API-Key',
    )
    // Authentication & User Management
    .addTag('Authentication', 'User authentication, registration, and OTP verification')
    .addTag('Users', 'User profile management and preferences')
    .addTag('Admin', 'Administrative functions and system management')
    // Marketplace & Commerce
    .addTag('Products', 'Product catalog, categories, and inventory management')
    .addTag('Orders', 'Order processing, tracking, and management')
    .addTag('Payments', 'Payment processing, transactions, and billing')
    .addTag('Marketplace', 'Store management and vendor operations')
    // Delivery & Logistics
    .addTag('Delivery', 'Delivery tracking, assignment, and logistics')
    .addTag('Drivers', 'Driver management and route optimization')
    .addTag('Errands', 'Errand services and task management')
    // Communication & Engagement
    .addTag('Chat', 'Real-time messaging and communication')
    .addTag('Notifications', 'Push notifications and alerts')
    .addTag('Loyalty', 'Loyalty programs and rewards system')
    // System & Utilities
    .addTag('System', 'System health checks and application status')
    .addTag('Search', 'Search functionality and filters')
    .addTag('Scheduling', 'Task scheduling and automation')
    .addServer(process.env.API_BASE_URL || 'http://192.168.100.147')
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.ntumai.com', 'Production Server')
>>>>>>> main
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add request ID for tracking
        req.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return req;
      },
    },
    customSiteTitle: 'NTUMAI API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    `,
    customCssUrl: '',
  });
  
  // Also setup JSON endpoint for external tools
  SwaggerModule.setup('api/docs-json', app, document, {
    jsonDocumentUrl: 'swagger.json',
    yamlDocumentUrl: 'swagger.yaml',
  });
  
  // Bind to all network interfaces
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on:`);
  console.log(`   - Local: http://localhost:${port}`);
  console.log(`   - Network: http://192.168.100.147:${port}`);
  console.log(`📚 Swagger documentation available at:`);
  console.log(`   - Local: http://localhost:${port}/api/docs`);
  console.log(`   - Network: http://192.168.100.147:${port}/api/docs`);
}
bootstrap();
