import { Module } from '@nestjs/common';
import {
  DeliveryController,
  RiderDeliveryController,
} from './presentation/controllers/delivery.controller';
import { DeliveryService } from './application/services/delivery.service';
import { InMemoryDeliveryRepository } from './infrastructure/repositories/in-memory-delivery.repository';
import { DeliveriesGateway } from './infrastructure/websocket/deliveries.gateway';
import { DELIVERY_REPOSITORY } from './domain/repositories/delivery.repository.interface';
import { AuthModule } from '../auth/auth.module';
// import { PricingModule } from '../pricing/pricing.module'; // Removed due to missing PricingModule

@Module({
  imports: [AuthModule],
  controllers: [DeliveryController, RiderDeliveryController],
  providers: [
    DeliveryService,
    DeliveriesGateway,
    {
      provide: DELIVERY_REPOSITORY,
      useClass: InMemoryDeliveryRepository,
    },
  ],
  exports: [DeliveryService],
})
export class DeliveriesModule {}
