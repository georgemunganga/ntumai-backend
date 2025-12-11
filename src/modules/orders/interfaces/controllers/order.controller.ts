import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { CreateOrderDto, UpdateOrderDto } from '../dtos/order.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user (Order History)' })
  @ApiResponse({ status: 200, description: 'List of orders retrieved successfully.' })
  async findUserOrders(@Param('userId') userId: string) {
    return this.orderService.findUserOrders(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }
}
