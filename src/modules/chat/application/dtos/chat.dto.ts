import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export enum ChatContextTypeDto {
  MARKETPLACE_ORDER = 'marketplace_order',
  DELIVERY = 'delivery',
  BOOKING = 'booking',
  SUPPORT_TICKET = 'support_ticket',
}

export class GetOrCreateConversationDto {
  @ApiProperty({ enum: ChatContextTypeDto })
  @IsEnum(ChatContextTypeDto)
  contextType!: ChatContextTypeDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contextId!: string;
}

export class SendConversationMessageDto {
  @ApiProperty({ example: 'Hello, I am on my way.' })
  @IsString()
  @Length(1, 4000)
  body!: string;

  @ApiPropertyOptional({ example: 'text' })
  @IsOptional()
  @IsString()
  messageType?: string;
}

export class ConversationParticipantDto {
  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  role?: string | null;

  @ApiPropertyOptional()
  firstName?: string | null;

  @ApiPropertyOptional()
  lastName?: string | null;

  @ApiPropertyOptional()
  profileImage?: string | null;

  @ApiPropertyOptional()
  lastReadAt?: string | null;
}

export class ConversationMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiPropertyOptional()
  senderName?: string | null;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  messageType!: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;
}

export class ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ChatContextTypeDto })
  contextType!: ChatContextTypeDto;

  @ApiProperty()
  contextId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [ConversationParticipantDto] })
  participants!: ConversationParticipantDto[];

  @ApiPropertyOptional({ type: ConversationMessageDto })
  lastMessage?: ConversationMessageDto | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ConversationResponseDto {
  @ApiProperty({ type: ConversationDto })
  conversation!: ConversationDto;
}

export class ConversationMessagesResponseDto {
  @ApiProperty({ type: ConversationDto })
  conversation!: ConversationDto;

  @ApiProperty({ type: [ConversationMessageDto] })
  messages!: ConversationMessageDto[];
}

export class SendMessageResponseDto {
  @ApiProperty({ type: ConversationMessageDto })
  message!: ConversationMessageDto;
}

export class MarkConversationReadResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  readAt!: string;
}
