import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { Transaction as PrismaTransaction } from '@prisma/client';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    return transaction ? this.toDomain(transaction) : null;
  }

  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const saved = await this.prisma.transaction.upsert({
      where: { id: transaction.id || 'non-existent-id' },
      update: { ...transaction, amount: transaction.amount },
      create: { ...transaction, amount: transaction.amount },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaTransaction): TransactionEntity {
    return new TransactionEntity({
      ...raw,
      referenceId: raw.referenceId ?? undefined,
      amount: raw.amount.toNumber(),
    });
  }
}
