import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './shared/config/configuration';
import { DatabaseModule } from './shared/database/database.module';
import { ResponseInterceptor } from './shared/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './shared/common/filters/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PricingModule } from './pricing/pricing.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { PaymentsModule } from './payments/payments.module';
import { ShiftsModule } from './shifts/shifts.module';
import { MatchingModule } from './matching/matching.module';
import { TrackingModule } from './tracking/tracking.module';
import { OrdersModule } from './orders/orders.module';
import { CommunicationsModule } from './communications/communications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './auth/infrastructure/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    DatabaseModule,
    CommunicationsModule,
    NotificationsModule,
    AuthModule,
    UserModule,
    MarketplaceModule,
    PricingModule,
    DeliveriesModule,
    PaymentsModule,
    ShiftsModule,
    MatchingModule,
    TrackingModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
