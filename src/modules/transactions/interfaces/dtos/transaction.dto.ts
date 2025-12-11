import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  walletId: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
