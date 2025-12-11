import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Ntumai API')
    .setDescription('The official API documentation for the Ntumai Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.get('KAFKA_BROKERS').split(','),
      },
      consumer: {
        groupId: 'ntumai-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  // Enable WebSockets (Socket.io)
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
