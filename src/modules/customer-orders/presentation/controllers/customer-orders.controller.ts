import {
  Body,
  Controller,
  Get,
  Param,
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
import { CustomerOrdersService } from '../../application/services/customer-orders.service';

@ApiTags('Customer Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/customer/orders')
export class CustomerOrdersController {
  constructor(private readonly customerOrdersService: CustomerOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List unified customer orders across marketplace, deliveries, and tasks',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'marketplace', 'delivery', 'task'] })
  @ApiQuery({ name: 'section', required: false, enum: ['all', 'active', 'history'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Unified customer orders retrieved successfully' })
  async list(
    @Req() req: any,
    @Query('type') type?: 'all' | 'marketplace' | 'delivery' | 'task',
    @Query('section') section?: 'all' | 'active' | 'history',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerOrdersService.listOrders(req.user.userId, {
      type,
      section,
      page: Number(page || 1),
      limit: Number(limit || 20),
    });
  }

  @Post('deliveries/:deliveryId/rate-tasker')
  @ApiOperation({ summary: 'Rate tasker for a completed delivery' })
  @ApiResponse({ status: 200, description: 'Tasker rating submitted successfully' })
  async rateDeliveryTasker(
    @Req() req: any,
    @Param('deliveryId') deliveryId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    const result = await this.customerOrdersService.rateDeliveryTasker(
      req.user.userId,
      deliveryId,
      body,
    );

    return { success: true, data: result };
  }

  @Post('bookings/:bookingId/rate-tasker')
  @ApiOperation({ summary: 'Rate tasker for a completed task booking' })
  @ApiResponse({ status: 200, description: 'Tasker rating submitted successfully' })
  async rateBookingTasker(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    const result = await this.customerOrdersService.rateBookingTasker(
      req.user.userId,
      bookingId,
      body,
    );

    return { success: true, data: result };
  }
}
