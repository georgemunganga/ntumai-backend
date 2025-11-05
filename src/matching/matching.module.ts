import { Module } from '@nestjs/common';
import { MatchingController } from './presentation/controllers/matching.controller';
import { MatchingService } from './application/services/matching.service';
import { PrismaBookingRepository } from './infrastructure/repositories/prisma-booking.repository';
import { MockMatchingEngineAdapter } from './infrastructure/adapters/mock-matching-engine.adapter';
import { MatchingGateway } from './infrastructure/websocket/matching.gateway';
import { BOOKING_REPOSITORY } from './domain/repositories/booking.repository.interface';
import { DatabaseModule } from '../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    MatchingGateway,
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
    {
      provide: 'MATCHING_ENGINE',
      useClass: MockMatchingEngineAdapter,
    },
  ],
  exports: [MatchingService, BOOKING_REPOSITORY],
})
export class MatchingModule {}
