import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { Wallet as PrismaWallet, Transaction as PrismaTransaction } from '@prisma/client';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WalletEntity | null> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id }, include: { transactions: true } });
    return wallet ? this.toDomain(wallet) : null;
  }

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId }, include: { transactions: true } });
    return wallet ? this.toDomain(wallet) : null;
  }

  async save(wallet: WalletEntity): Promise<WalletEntity> {
    const saved = await this.prisma.wallet.upsert({
      where: { id: wallet.id || 'non-existent-id' },
      update: { balance: wallet.balance, floatBalance: wallet.floatBalance },
      create: { id: wallet.id, userId: wallet.userId, currency: wallet.currency, balance: wallet.balance, floatBalance: wallet.floatBalance },
      include: { transactions: true },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaWallet & { transactions: PrismaTransaction[] }): WalletEntity {
    return new WalletEntity({ ...raw, balance: raw.balance.toNumber(), floatBalance: raw.floatBalance.toNumber() });
  }
}
