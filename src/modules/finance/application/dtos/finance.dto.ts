import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class UpdatePayoutRequestStatusDto {
  @ApiProperty({ enum: ['processing', 'paid', 'rejected', 'cancelled'] })
  @IsIn(['processing', 'paid', 'rejected', 'cancelled'])
  status!: 'processing' | 'paid' | 'rejected' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;
}

export class VendorSubscriptionPlanDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  monthlyPrice!: number;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  features!: string[];

  @ApiProperty()
  recommended!: boolean;
}

export class VendorSubscriptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  planCode!: string;

  @ApiProperty()
  planName!: string;

  @ApiProperty()
  monthlyPrice!: number;

  @ApiProperty()
  billingCycle!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty()
  renewsAt!: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown> | null;
}

export class VendorSubscriptionResponseDto {
  @ApiProperty({ type: VendorSubscriptionDto })
  subscription!: VendorSubscriptionDto;

  @ApiProperty({ type: [VendorSubscriptionPlanDto] })
  availablePlans!: VendorSubscriptionPlanDto[];
}

export class SelectVendorSubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  planCode!: string;
}

export class LoyaltyTierDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  minPoints!: number;

  @ApiProperty()
  color!: string;

  @ApiProperty({ type: [String] })
  benefits!: string[];
}

export class LoyaltyTransactionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['earned', 'redeemed', 'expired'] })
  type!: 'earned' | 'redeemed' | 'expired';

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  orderId?: string | null;

  @ApiProperty()
  timestamp!: string;
}

export class LoyaltyRewardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  pointsCost!: number;

  @ApiProperty({ enum: ['discount', 'free_delivery', 'voucher'] })
  type!: 'discount' | 'free_delivery' | 'voucher';

  @ApiProperty()
  value!: number;

  @ApiProperty()
  expiryDays!: number;

  @ApiProperty()
  icon!: string;

  @ApiProperty()
  available!: boolean;
}

export class LoyaltyResponseDto {
  @ApiProperty()
  totalPoints!: number;

  @ApiProperty()
  availablePoints!: number;

  @ApiProperty({ type: LoyaltyTierDto })
  currentTier!: LoyaltyTierDto;

  @ApiPropertyOptional({ type: LoyaltyTierDto })
  nextTier?: LoyaltyTierDto | null;

  @ApiProperty()
  pointsToNextTier!: number;

  @ApiProperty({ type: [LoyaltyTransactionDto] })
  transactions!: LoyaltyTransactionDto[];

  @ApiProperty({ type: [LoyaltyRewardDto] })
  rewards!: LoyaltyRewardDto[];
}

export class RedeemLoyaltyRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  rewardId!: string;
}
