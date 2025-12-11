import { Injectable } from '@nestjs/common';
import { WalletRepository } from '../../infrastructure/repositories/wallet.repository';
import { WalletEntity } from '../../domain/entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async findById(id: string): Promise<WalletEntity | null> {
    return this.walletRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    return this.walletRepository.findByUserId(userId);
  }

  async create(data: Partial<WalletEntity>): Promise<WalletEntity> {
    const wallet = new WalletEntity(data);
    return this.walletRepository.save(wallet);
  }

  async update(id: string, data: Partial<WalletEntity>): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findById(id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    Object.assign(wallet, data);
    return this.walletRepository.save(wallet);
  }
}
