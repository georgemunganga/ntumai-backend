import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Ntumai API')
    .setDescription(
      'The official API documentation for the Ntumai Platform. ' +
        'Ntumai is a hybrid on-demand service platform supporting marketplace purchases, ' +
        'P2P deliveries, and general errands with multi-role user system.\n\n' +
        '**User Roles:**\n' +
        '- **CUSTOMER**: Creates orders, deliveries, and errands\n' +
        '- **TASKER** (RIDER): Fulfills deliveries and tasks (requires KYC)\n' +
        '- **VENDOR**: Manages products and marketplace orders (requires KYC)\n\n' +
        '**Authentication:**\n' +
        'Use the `/api/v1/auth/otp/start` and `/api/v1/auth/otp/verify` endpoints to obtain a JWT token. ' +
        'Then click the "Authorize" button and enter your token as `Bearer <your-token>`.'
    )
    .setVersion('1.0')
    .setContact(
      'Ntumai Support',
      'https://ntumai.com',
      'support@ntumai.com'
    )
    .setLicense('Proprietary', 'https://ntumai.com/license')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token obtained from authentication endpoints',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'OTP-based authentication and role management')
    .addTag('Marketplace', 'Product catalog, cart, and order management')
    .addTag('Deliveries', 'P2P delivery and package management')
    .addTag('Matching', 'Tasker job assignment and booking management')
    .addTag('Shifts', 'Tasker shift management and analytics')
    .addTag('Tracking', 'Real-time location tracking and updates')
    .addTag('Users', 'User profile and preferences management')
    .addTag('Notifications', 'Push notifications and in-app messages')
    .addTag('Payments', 'Payment methods and transaction processing')
    .addTag('Wallet', 'Wallet balance and transaction history')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Ntumai API Documentation',
    customfavIcon: 'https://ntumai.com/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  logger.log('📚 Swagger documentation available at /api/docs');

  // Kafka Microservice (optional)
  const kafkaEnabled = configService.get<string>('ENABLE_KAFKA') === 'true';
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS');
  if (kafkaEnabled && kafkaBrokers) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId:
            configService.get('KAFKA_CLIENT_ID') || 'ntumai-consumer-server',
          brokers: kafkaBrokers
            .split(',')
            .map((broker) => broker.trim())
            .filter(Boolean),
        },
        consumer: {
          groupId: 'ntumai-consumer',
        },
      },
    });
    try {
      await app.startAllMicroservices();
    } catch (error) {
      logger.error(
        `Failed to start Kafka microservice: ${error instanceof Error ? error.message : error}`,
      );
    }
  } else {
    logger.warn(
      'Kafka microservice disabled. Set ENABLE_KAFKA=true and provide KAFKA_BROKERS to enable it.',
    );
  }

  // Enable WebSockets (Socket.io)
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
