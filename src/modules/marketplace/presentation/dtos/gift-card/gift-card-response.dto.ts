import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GiftCardStatus } from './create-gift-card.dto';

export class GiftCardResponseDto {
  @ApiProperty({ description: 'Gift card ID' })
  id: string;

  @ApiProperty({ description: 'Gift card code' })
  code: string;

  @ApiProperty({ description: 'Original gift card amount' })
  amount: number;

  @ApiProperty({ description: 'Current balance' })
  balance: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Gift card description or message' })
  description?: string;

  @ApiPropertyOptional({ description: 'Recipient email address' })
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Sender name' })
  senderName?: string;

  @ApiPropertyOptional({ description: 'Personal message from sender' })
  message?: string;

  @ApiProperty({ description: 'Gift card status', enum: GiftCardStatus })
  status: GiftCardStatus;

  @ApiProperty({ description: 'Is gift card currently usable' })
  isUsable: boolean;

  @ApiProperty({ description: 'Is gift card expired' })
  isExpired: boolean;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiProperty({ description: 'Total amount used' })
  totalUsed: number;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'First usage date' })
  firstUsedAt?: Date;

  @ApiPropertyOptional({ description: 'Last usage date' })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class GiftCardListResponseDto {
  @ApiProperty({ description: 'Gift card ID' })
  id: string;

  @ApiProperty({ description: 'Gift card code' })
  code: string;

  @ApiProperty({ description: 'Original amount' })
  amount: number;

  @ApiProperty({ description: 'Current balance' })
  balance: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  recipientName?: string;

  @ApiProperty({ description: 'Gift card status', enum: GiftCardStatus })
  status: GiftCardStatus;

  @ApiProperty({ description: 'Is gift card currently usable' })
  isUsable: boolean;

  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class GiftCardValidationResponseDto {
  @ApiProperty({ description: 'Is gift card valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation message' })
  message: string;

  @ApiPropertyOptional({ description: 'Gift card details if valid' })
  giftCard?: GiftCardResponseDto;

  @ApiPropertyOptional({ description: 'Available balance' })
  availableBalance?: number;

  @ApiPropertyOptional({ description: 'Amount that can be applied' })
  applicableAmount?: number;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors: string[];
}

export class GiftCardUsageDto {
  @ApiProperty({ description: 'Usage ID' })
  id: string;

  @ApiProperty({ description: 'Order ID where gift card was used' })
  orderId: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Amount used' })
  amountUsed: number;

  @ApiProperty({ description: 'Usage date' })
  usedAt: Date;
}

export class GiftCardUsageHistoryResponseDto {
  @ApiProperty({ description: 'Gift card information' })
  giftCard: GiftCardResponseDto;

  @ApiProperty({ description: 'Usage history', type: [GiftCardUsageDto] })
  usageHistory: GiftCardUsageDto[];

  @ApiProperty({ description: 'Total usage count' })
  totalUsages: number;

  @ApiProperty({ description: 'Total amount used' })
  totalAmountUsed: number;

  @ApiProperty({ description: 'Remaining balance' })
  remainingBalance: number;
}

export class GiftCardStatsResponseDto {
  @ApiProperty({ description: 'Total gift cards count' })
  totalGiftCards: number;

  @ApiProperty({ description: 'Active gift cards count' })
  activeGiftCards: number;

  @ApiProperty({ description: 'Used gift cards count' })
  usedGiftCards: number;

  @ApiProperty({ description: 'Expired gift cards count' })
  expiredGiftCards: number;

  @ApiProperty({ description: 'Total gift card value issued' })
  totalValueIssued: number;

  @ApiProperty({ description: 'Total gift card value used' })
  totalValueUsed: number;

  @ApiProperty({ description: 'Total outstanding balance' })
  totalOutstandingBalance: number;

  @ApiProperty({ description: 'Average gift card value' })
  averageGiftCardValue: number;

  @ApiProperty({ description: 'Gift card redemption rate (percentage)' })
  redemptionRate: number;
}