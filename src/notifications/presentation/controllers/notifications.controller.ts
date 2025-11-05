import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { NotificationsService } from '../../application/services/notifications.service';
import {
  NotificationResponseDto,
  NotificationsListResponseDto,
} from '../../application/dtos/notification-response.dto';
import { NotificationEntity } from '../../domain/entities/notification.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'includeRead',
    required: false,
    type: Boolean,
    description: 'Include read notifications (default true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved',
    type: NotificationsListResponseDto,
  })
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeRead') includeRead?: string,
  ) {
    const userId = req.user.userId;
    const parsedPage = page ? Number(page) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;
    const includeReadValue =
      includeRead !== undefined ? includeRead === 'true' : undefined;

    const result = await this.notificationsService.getUserNotifications(
      userId,
      {
        page: parsedPage,
        limit: parsedLimit,
        includeRead: includeReadValue,
      },
    );

    return {
      success: true,
      data: {
        notifications: result.notifications.map((notification) =>
          this.mapNotification(notification),
        ),
        meta: result.meta,
        unreadCount: result.unreadCount,
      },
    };
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markNotificationAsRead(
    @Request() req: any,
    @Param('notificationId') notificationId: string,
  ) {
    const userId = req.user.userId;
    const notification = await this.notificationsService.markNotificationAsRead(
      userId,
      notificationId,
    );

    return {
      success: true,
      data: {
        notification: this.mapNotification(notification),
      },
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllNotificationsAsRead(@Request() req: any) {
    const userId = req.user.userId;
    const updatedCount =
      await this.notificationsService.markAllNotificationsAsRead(userId);

    return {
      success: true,
      data: {
        updated: updatedCount,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread notification count retrieved',
  })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.userId;
    const count = await this.notificationsService.getUnreadCount(userId);

    return {
      success: true,
      data: {
        unreadCount: count,
      },
    };
  }

  private mapNotification(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
