import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class FinanceSummaryResponseDto {
  @ApiProperty({ enum: ['customer', 'tasker', 'vendor'] })
  role!: 'customer' | 'tasker' | 'vendor';

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  availableBalance!: number;

  @ApiProperty()
  pendingBalance!: number;

  @ApiProperty()
  totalEarned!: number;

  @ApiProperty()
  totalPaidOut!: number;

  @ApiProperty()
  totalSpent!: number;

  @ApiProperty()
  totalRefunded!: number;

  @ApiProperty()
  transactionCount!: number;

  @ApiPropertyOptional()
  meta?: Record<string, unknown>;
}

export class FinanceTransactionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['credit', 'debit'] })
  direction!: 'credit' | 'debit';

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  reference?: string | null;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}

export class FinanceTransactionListResponseDto {
  @ApiProperty({ type: [FinanceTransactionDto] })
  transactions!: FinanceTransactionDto[];
}

export class PayoutRequestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['customer', 'tasker', 'vendor'] })
  role!: 'customer' | 'tasker' | 'vendor';

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ type: Object })
  destination?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  processedAt?: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class PayoutRequestListResponseDto {
  @ApiProperty({ type: [PayoutRequestDto] })
  payoutRequests!: PayoutRequestDto[];
}

export class CreatePayoutRequestInputDto {
  @ApiProperty({ enum: ['tasker', 'vendor'] })
  @IsIn(['tasker', 'vendor'])
  role!: 'tasker' | 'vendor';

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ type: Object })
  @IsObject()
  @IsNotEmpty()
  destination!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  notes?: string;
}

export class FinanceRoleQueryDto {
  @ApiProperty({ enum: ['customer', 'tasker', 'vendor'] })
  @IsIn(['customer', 'tasker', 'vendor'])
  role!: 'customer' | 'tasker' | 'vendor';
}
