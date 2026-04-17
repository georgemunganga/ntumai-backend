import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({
    enum: ['order_update', 'delivery', 'promotion', 'system', 'chat'],
  })
  type!: 'order_update' | 'delivery' | 'promotion' | 'system' | 'chat';

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  notifications!: NotificationResponseDto[];

  @ApiProperty()
  unreadCount!: number;
}

export class NotificationMutationResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  unreadCount!: number;
}
