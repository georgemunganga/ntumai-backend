import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
// Removed modules due to incompatibility with new schema

// Staging modules
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SupportModule } from './modules/support/support.module';
import { CustomerOrdersModule } from './modules/customer-orders/customer-orders.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

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
    PaymentsModule,
    SupportModule,
    CustomerOrdersModule,
    ChatModule,
    NotificationsModule,
    FinanceModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
