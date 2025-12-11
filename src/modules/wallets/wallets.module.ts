import { Module } from '@nestjs/common';
import { WalletController } from './interfaces/controllers/wallet.controller';
import { WalletService } from './application/services/wallet.service';
import { WalletRepository } from './infrastructure/repositories/wallet.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, PrismaService],
  exports: [WalletService, WalletRepository],
})
export class WalletsModule {}
