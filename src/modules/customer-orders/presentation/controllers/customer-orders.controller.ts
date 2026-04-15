import {
  Controller,
  Get,
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
}
