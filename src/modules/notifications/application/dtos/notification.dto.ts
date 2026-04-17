import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

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

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: true,
  })
  metadata?: Record<string, unknown> | null;

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

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceId!: string;

  @ApiProperty({ enum: ['android', 'ios', 'web'] })
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform!: 'android' | 'ios' | 'web';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  pushToken!: string;
}
