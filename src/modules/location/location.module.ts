import { Module } from '@nestjs/common';
import { LocationController } from './interfaces/controllers/location.controller';
import { LocationService } from './application/services/location.service';
import { RealTimeLocationGateway } from './location.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import { LocationRepository } from './infrastructure/repositories/location.repository';
import { LocationConsumer } from './location.consumer';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  imports: [KafkaModule],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository, PrismaService, RealTimeLocationGateway, LocationConsumer],
  exports: [LocationService, LocationRepository],
})
export class LocationModule {}
