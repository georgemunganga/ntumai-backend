import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
  IsArray,
  Min,
  Max,
  Length,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  SYSTEM = 'SYSTEM',
  NOTIFICATION = 'NOTIFICATION',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ConversationType {
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  ORDER_CHAT = 'ORDER_CHAT',
  VENDOR_CHAT = 'VENDOR_CHAT',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  EMERGENCY = 'EMERGENCY',
}

export enum NotificationType {
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  PERFORMANCE_UPDATE = 'PERFORMANCE_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  PROMOTION = 'PROMOTION',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  POLICY_UPDATE = 'POLICY_UPDATE',
  TRAINING_REMINDER = 'TRAINING_REMINDER',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_RESPONSE = 'WAITING_FOR_RESPONSE',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum SupportCategory {
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  ORDER_ISSUE = 'ORDER_ISSUE',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  VEHICLE_ISSUE = 'VEHICLE_ISSUE',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  POLICY_QUESTION = 'POLICY_QUESTION',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  COMPLAINT = 'COMPLAINT',
  OTHER = 'OTHER',
}

// Message Attachment DTO
export class MessageAttachmentDto {
  @ApiProperty({ description: 'Attachment ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Attachment type', enum: MessageType })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ description: 'File URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  fileSize: number;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL for images/videos' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Duration for audio/video in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Image/video dimensions' })
  @IsOptional()
  @IsObject()
  dimensions?: {
    width: number;
    height: number;
  };
}

// Send Message DTO
export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiPropertyOptional({ description: 'Message content (required for text messages)' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  content?: string;

  @ApiPropertyOptional({ description: 'Message attachments', type: [MessageAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];

  @ApiPropertyOptional({ description: 'Reply to message ID' })
  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'Message metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Message Response DTO
export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Sender ID' })
  senderId: string;

  @ApiProperty({ description: 'Sender name' })
  senderName: string;

  @ApiProperty({ description: 'Sender type (rider, customer, support, system)' })
  senderType: string;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  messageType: MessageType;

  @ApiPropertyOptional({ description: 'Message content' })
  content?: string;

  @ApiPropertyOptional({ description: 'Message attachments', type: [MessageAttachmentDto] })
  attachments?: MessageAttachmentDto[];

  @ApiProperty({ description: 'Message status', enum: MessageStatus })
  status: MessageStatus;

  @ApiPropertyOptional({ description: 'Reply to message ID' })
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'Replied message content' })
  replyToContent?: string;

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: string;

  @ApiPropertyOptional({ description: 'Message read timestamp' })
  readAt?: string;

  @ApiPropertyOptional({ description: 'Message delivered timestamp' })
  deliveredAt?: string;

  @ApiPropertyOptional({ description: 'Message metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Message creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}

// Conversation DTO
export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  id: string;

  @ApiProperty({ description: 'Conversation type', enum: ConversationType })
  type: ConversationType;

  @ApiProperty({ description: 'Conversation title' })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: 'Participants in the conversation' })
  participants: Array<{
    id: string;
    name: string;
    type: string;
    profilePictureUrl?: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;

  @ApiPropertyOptional({ description: 'Related order ID' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related support ticket ID' })
  supportTicketId?: string;

  @ApiPropertyOptional({ description: 'Last message', type: MessageResponseDto })
  lastMessage?: MessageResponseDto;

  @ApiProperty({ description: 'Unread message count' })
  @IsNumber()
  @Min(0)
  unreadCount: number;

  @ApiProperty({ description: 'Conversation status (active, archived, closed)' })
  status: string;

  @ApiProperty({ description: 'Conversation creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityAt: string;

  @ApiPropertyOptional({ description: 'Conversation metadata' })
  metadata?: Record<string, any>;
}

// Get Messages DTO
export class GetMessagesDto {
  @ApiPropertyOptional({ description: 'Filter by conversation ID' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Filter by message type', enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: 'Filter by sender ID' })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ description: 'Filter by date (from)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date (to)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search in message content' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Messages Response DTO
export class PaginatedMessagesResponseDto {
  @ApiProperty({ description: 'List of messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total number of messages' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Mark Messages Read DTO
export class MarkMessagesReadDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiPropertyOptional({ description: 'Specific message IDs to mark as read' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];

  @ApiPropertyOptional({ description: 'Mark all messages in conversation as read' })
  @IsOptional()
  @IsBoolean()
  markAll?: boolean;
}

// Notification DTO
export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  @Length(1, 1000)
  message: string;

  @ApiPropertyOptional({ description: 'Notification icon URL' })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Notification image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Action URL or deep link' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Action button text' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  actionText?: string;

  @ApiPropertyOptional({ description: 'Related entity ID (order, shift, etc.)' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiProperty({ description: 'Whether notification is read' })
  @IsBoolean()
  isRead: boolean;

  @ApiProperty({ description: 'Whether notification was sent via push' })
  @IsBoolean()
  isPushSent: boolean;

  @ApiProperty({ description: 'Whether notification was sent via email' })
  @IsBoolean()
  isEmailSent: boolean;

  @ApiProperty({ description: 'Whether notification was sent via SMS' })
  @IsBoolean()
  isSmsSent: boolean;

  @ApiPropertyOptional({ description: 'Notification expiry date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Notification read timestamp' })
  @IsOptional()
  @IsDateString()
  readAt?: string;

  @ApiProperty({ description: 'Notification creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

// Send Notification DTO
export class SendNotificationDto {
  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  @Length(1, 1000)
  message: string;

  @ApiPropertyOptional({ description: 'Target rider IDs (if empty, sends to all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riderIds?: string[];

  @ApiPropertyOptional({ description: 'Notification icon URL' })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Notification image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Action URL or deep link' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Action button text' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  actionText?: string;

  @ApiPropertyOptional({ description: 'Send via push notification' })
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = true;

  @ApiPropertyOptional({ description: 'Send via email' })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = false;

  @ApiPropertyOptional({ description: 'Send via SMS' })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean = false;

  @ApiPropertyOptional({ description: 'Schedule notification for later' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ description: 'Notification expiry date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

// Get Notifications DTO
export class GetNotificationsDto {
  @ApiPropertyOptional({ description: 'Filter by notification type', enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Filter by date (from)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date (to)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Notifications Response DTO
export class PaginatedNotificationsResponseDto {
  @ApiProperty({ description: 'List of notifications', type: [NotificationDto] })
  notifications: NotificationDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Unread notifications count' })
  unreadCount: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Mark Notifications Read DTO
export class MarkNotificationsReadDto {
  @ApiPropertyOptional({ description: 'Specific notification IDs to mark as read' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationIds?: string[];

  @ApiPropertyOptional({ description: 'Mark all notifications as read' })
  @IsOptional()
  @IsBoolean()
  markAll?: boolean;
}

// Create Support Ticket DTO
export class CreateSupportTicketDto {
  @ApiProperty({ description: 'Support category', enum: SupportCategory })
  @IsEnum(SupportCategory)
  category: SupportCategory;

  @ApiProperty({ description: 'Ticket priority', enum: SupportTicketPriority })
  @IsEnum(SupportTicketPriority)
  priority: SupportTicketPriority;

  @ApiProperty({ description: 'Ticket subject' })
  @IsString()
  @Length(1, 200)
  subject: string;

  @ApiProperty({ description: 'Ticket description' })
  @IsString()
  @Length(1, 2000)
  description: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Attachment URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Additional ticket metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Support Ticket Response DTO
export class SupportTicketResponseDto {
  @ApiProperty({ description: 'Ticket ID' })
  id: string;

  @ApiProperty({ description: 'Ticket number' })
  ticketNumber: string;

  @ApiProperty({ description: 'Rider ID' })
  riderId: string;

  @ApiProperty({ description: 'Support category', enum: SupportCategory })
  category: SupportCategory;

  @ApiProperty({ description: 'Ticket priority', enum: SupportTicketPriority })
  priority: SupportTicketPriority;

  @ApiProperty({ description: 'Ticket status', enum: SupportTicketStatus })
  status: SupportTicketStatus;

  @ApiProperty({ description: 'Ticket subject' })
  subject: string;

  @ApiProperty({ description: 'Ticket description' })
  description: string;

  @ApiPropertyOptional({ description: 'Related order ID' })
  orderId?: string;

  @ApiPropertyOptional({ description: 'Related shift ID' })
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Assigned support agent ID' })
  assignedAgentId?: string;

  @ApiPropertyOptional({ description: 'Assigned support agent name' })
  assignedAgentName?: string;

  @ApiPropertyOptional({ description: 'Attachment URLs' })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Resolution notes' })
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Customer satisfaction rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;

  @ApiPropertyOptional({ description: 'Customer feedback' })
  customerFeedback?: string;

  @ApiProperty({ description: 'Ticket creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Ticket resolution date' })
  resolvedAt?: string;

  @ApiPropertyOptional({ description: 'Ticket closure date' })
  closedAt?: string;

  @ApiPropertyOptional({ description: 'Additional ticket metadata' })
  metadata?: Record<string, any>;
}

// Get Support Tickets DTO
export class GetSupportTicketsDto {
  @ApiPropertyOptional({ description: 'Filter by category', enum: SupportCategory })
  @IsOptional()
  @IsEnum(SupportCategory)
  category?: SupportCategory;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({ description: 'Filter by status', enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ description: 'Filter by creation date (from)' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (to)' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Search in subject and description' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Support Tickets Response DTO
export class PaginatedSupportTicketsResponseDto {
  @ApiProperty({ description: 'List of support tickets', type: [SupportTicketResponseDto] })
  tickets: SupportTicketResponseDto[];

  @ApiProperty({ description: 'Total number of tickets' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Update Support Ticket DTO
export class UpdateSupportTicketDto {
  @ApiPropertyOptional({ description: 'Ticket priority', enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({ description: 'Additional description or update' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  additionalInfo?: string;

  @ApiPropertyOptional({ description: 'Additional attachment URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  additionalAttachments?: string[];

  @ApiPropertyOptional({ description: 'Customer satisfaction rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;

  @ApiPropertyOptional({ description: 'Customer feedback' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  customerFeedback?: string;
}