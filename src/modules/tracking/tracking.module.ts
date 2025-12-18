import { Module } from '@nestjs/common';
import { TrackingController } from './presentation/controllers/tracking.controller';
import { TrackingService } from './application/services/tracking.service';
import { PrismaTrackingRepository } from './infrastructure/repositories/prisma-tracking.repository';
import { TrackingGateway } from './infrastructure/websocket/tracking.gateway';
import { TRACKING_REPOSITORY } from './domain/repositories/tracking.repository.interface';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TrackingController],
  providers: [
    TrackingService,
    TrackingGateway,
    {
      provide: TRACKING_REPOSITORY,
      useClass: PrismaTrackingRepository,
    },
  ],
  exports: [TrackingService, TRACKING_REPOSITORY],
})
export class TrackingModule {}
