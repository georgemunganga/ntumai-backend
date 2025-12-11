import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../../infrastructure/repositories/transaction.repository';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    return this.transactionRepository.findById(id);
  }

  async create(data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const transaction = new TransactionEntity(data);
    return this.transactionRepository.save(transaction);
  }
}
