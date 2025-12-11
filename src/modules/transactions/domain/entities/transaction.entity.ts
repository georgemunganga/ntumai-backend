import { Transaction as PrismaTransaction, TransactionType } from '@prisma/client';

export class TransactionEntity {
  id: string;
  walletId: string;
  amount: number;
  transactionType: TransactionType;
  description: string;
  referenceId?: string;

  constructor(data: Partial<TransactionEntity>) {
    Object.assign(this, data);
  }
}
