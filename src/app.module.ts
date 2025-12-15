import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
// Removed modules due to incompatibility with new schema

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

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
