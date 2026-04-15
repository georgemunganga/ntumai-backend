import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { MatchingModule } from '../matching/matching.module';
import { CustomerOrdersController } from './presentation/controllers/customer-orders.controller';
import { CustomerOrdersService } from './application/services/customer-orders.service';

@Module({
  imports: [AuthModule, DeliveriesModule, MarketplaceModule, MatchingModule],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService],
  exports: [CustomerOrdersService],
})
export class CustomerOrdersModule {}
