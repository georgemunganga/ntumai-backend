import { Module } from '@nestjs/common';
import { RatingController } from './interfaces/controllers/rating.controller';
import { RatingService } from './application/services/rating.service';
import { RatingRepository } from './infrastructure/repositories/rating.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [RatingController],
  providers: [RatingService, RatingRepository, PrismaService],
  exports: [RatingService, RatingRepository],
})
export class RatingsModule {}
