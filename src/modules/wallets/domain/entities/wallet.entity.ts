import { Wallet as PrismaWallet, Transaction as PrismaTransaction } from '@prisma/client';

export class WalletEntity {
  id: string;
  userId: string;
  balance: number;
  floatBalance: number;
  currency: string;
  transactions: PrismaTransaction[];

  constructor(data: Partial<WalletEntity>) {
    Object.assign(this, data);
  }
}
