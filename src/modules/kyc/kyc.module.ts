import { Module } from '@nestjs/common';
import { KycController } from './interfaces/controllers/kyc.controller';
import { KycService } from './application/services/kyc.service';
import { KycRepository } from './infrastructure/repositories/kyc.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [KycController],
  providers: [KycService, KycRepository, PrismaService],
  exports: [KycService, KycRepository],
})
export class KycModule {}
