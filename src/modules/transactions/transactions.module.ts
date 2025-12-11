import { Module } from '@nestjs/common';
import { TransactionController } from './interfaces/controllers/transaction.controller';
import { TransactionService } from './application/services/transaction.service';
import { TransactionRepository } from './infrastructure/repositories/transaction.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository, PrismaService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionsModule {}
