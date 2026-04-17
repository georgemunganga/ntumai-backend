import {
  Controller,
  Delete,
  Get,
  Body,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  NotificationListResponseDto,
  NotificationMutationResponseDto,
  RegisterDeviceDto,
} from '../../application/dtos/notification.dto';
import { NotificationsService } from '../../application/services/notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    type: NotificationListResponseDto,
  })
  async list(@Req() req: any, @Query('limit') limit?: string) {
    return this.notificationsService.list(req.user.userId, Number(limit));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    type: NotificationMutationResponseDto,
  })
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    type: NotificationMutationResponseDto,
  })
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    type: NotificationMutationResponseDto,
  })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.remove(req.user.userId, id);
  }

  @Post('register-device')
  @ApiOperation({ summary: 'Register or refresh a push token for this device' })
  @ApiResponse({
    status: 200,
    type: NotificationMutationResponseDto,
  })
  async registerDevice(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(req.user.userId, dto);
  }
}
