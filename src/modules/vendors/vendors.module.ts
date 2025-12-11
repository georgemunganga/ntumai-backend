import { Module } from '@nestjs/common';
import { VendorController } from './interfaces/controllers/vendor.controller';
import { VendorService } from './application/services/vendor.service';
import { VendorRepository } from './infrastructure/repositories/vendor.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [VendorController],
  providers: [VendorService, VendorRepository, PrismaService],
  exports: [VendorService, VendorRepository],
})
export class VendorsModule {}
