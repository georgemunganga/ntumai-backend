import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID of the user making the payment' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID of the related order (optional)' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'ID of the related task (optional)' })
  @IsString()
  @IsOptional()
  taskId?: string;

  @ApiProperty({ description: 'Amount to be paid' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Method of payment' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Transaction ID from the payment gateway' })
  @IsString()
  transactionId: string;
}
