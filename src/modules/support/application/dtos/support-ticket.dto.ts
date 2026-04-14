import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportTicketCategoryDto {
  ACCOUNT = 'account',
  ORDER = 'order',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  ONBOARDING = 'onboarding',
  TECHNICAL = 'technical',
  GENERAL = 'general',
}

export enum SupportTicketStatusDto {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class CreateSupportTicketDto {
  @ApiProperty({ enum: SupportTicketCategoryDto, required: false })
  @IsOptional()
  @IsEnum(SupportTicketCategoryDto)
  category?: SupportTicketCategoryDto;

  @ApiProperty({ example: 'Payment issue with my wallet top up' })
  @IsString()
  @Length(3, 120)
  subject!: string;

  @ApiProperty({
    example:
      'I was charged but my wallet balance did not update after the transaction completed.',
  })
  @IsString()
  @Length(10, 5000)
  description!: string;
}

export class SupportTicketResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SupportTicketCategoryDto })
  category!: SupportTicketCategoryDto;

  @ApiProperty({ enum: SupportTicketStatusDto })
  status!: SupportTicketStatusDto;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class SupportTicketListResponseDto {
  @ApiProperty({ type: [SupportTicketResponseDto] })
  tickets!: SupportTicketResponseDto[];
}

export class SupportTicketMutationResponseDto {
  @ApiProperty({ type: SupportTicketResponseDto })
  ticket!: SupportTicketResponseDto;

  @ApiProperty({ type: [SupportTicketResponseDto] })
  tickets!: SupportTicketResponseDto[];
}

export class SupportTicketDetailResponseDto {
  @ApiProperty({ type: SupportTicketResponseDto })
  ticket!: SupportTicketResponseDto;
}
