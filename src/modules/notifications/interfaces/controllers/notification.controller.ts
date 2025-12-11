import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from '../../application/services/notification.service';
import { CreateNotificationDto } from '../dtos/notification.dto';

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.notificationService.findByUserId(userId);
  }

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
