import { Module } from '@nestjs/common';
import {
  DeliveryController,
  RiderDeliveryController,
} from './presentation/controllers/delivery.controller';
import { DeliveryService } from './application/services/delivery.service';
import { DeliveriesGateway } from './infrastructure/websocket/deliveries.gateway';
import { DELIVERY_REPOSITORY } from './domain/repositories/delivery.repository.interface';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaDeliveryRepository } from './infrastructure/repositories/prisma-delivery.repository';
// import { PricingModule } from '../pricing/pricing.module'; // Removed due to missing PricingModule

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DeliveryController, RiderDeliveryController],
  providers: [
    DeliveryService,
    DeliveriesGateway,
    {
      provide: DELIVERY_REPOSITORY,
      useClass: PrismaDeliveryRepository,
    },
  ],
  exports: [DeliveryService],
})
export class DeliveriesModule {}
