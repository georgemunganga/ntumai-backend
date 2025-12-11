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
    .setDescription('The official API documentation for the Ntumai Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Kafka Microservice (optional)
  const kafkaEnabled = configService.get<string>('ENABLE_KAFKA') === 'true';
  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS');
  if (kafkaEnabled && kafkaBrokers) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: configService.get('KAFKA_CLIENT_ID') || 'ntumai-consumer-server',
          brokers: kafkaBrokers.split(',').map(broker => broker.trim()).filter(Boolean),
        },
        consumer: {
          groupId: 'ntumai-consumer',
        },
      },
    });
    try {
      await app.startAllMicroservices();
    } catch (error) {
      logger.error(`Failed to start Kafka microservice: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    logger.warn('Kafka microservice disabled. Set ENABLE_KAFKA=true and provide KAFKA_BROKERS to enable it.');
  }

  // Enable WebSockets (Socket.io)
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
