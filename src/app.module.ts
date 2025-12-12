import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TaskersModule } from './modules/taskers/taskers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { KycModule } from './modules/kyc/kyc.module';
import { LocationModule } from './modules/location/location.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { KafkaModule } from './modules/kafka/kafka.module';

// Staging modules
import { DeliveriesModule } from './deliveries/deliveries.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { MatchingModule } from './matching/matching.module';
import { ShiftsModule } from './shifts/shifts.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    AuthModule,
    // Staging modules - integrated from staging branch
    DeliveriesModule,
    MarketplaceModule,
    MatchingModule,
    ShiftsModule,
    TrackingModule,
    // UsersModule,
    // CustomersModule,
    // TaskersModule,
    // VendorsModule,
    // TasksModule,
    // OrdersModule,
    // PricingModule,
    // PaymentsModule,
    // WalletsModule,
    // RatingsModule,
    // NotificationsModule,
    // KycModule,
    // LocationModule,
    // CommunicationModule,
    // KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
