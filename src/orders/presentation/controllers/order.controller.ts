import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from '../../application/services/order.service';
import {
  GetOrdersQueryDto,
  OrderResponseDto,
  OrdersListResponseDto,
} from '../../application/dtos/order.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user order history (marketplace + deliveries)',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved',
    type: OrdersListResponseDto,
  })
  async getOrders(
    @Req() req: any,
    @Query() query: GetOrdersQueryDto,
  ): Promise<OrdersListResponseDto> {
    return this.orderService.getOrders(req.user.userId, query);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved',
    type: OrderResponseDto,
  })
  async getOrderById(
    @Req() req: any,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrderById(orderId, req.user.userId);
  }

  @Get('marketplace/:marketplaceOrderId')
  @ApiOperation({ summary: 'Get order by marketplace order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved',
    type: OrderResponseDto,
  })
  async getOrderByMarketplaceOrderId(
    @Req() req: any,
    @Param('marketplaceOrderId') marketplaceOrderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrderByMarketplaceOrderId(
      marketplaceOrderId,
      req.user.userId,
    );
  }

  @Get('delivery/:deliveryId')
  @ApiOperation({ summary: 'Get order by delivery ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved',
    type: OrderResponseDto,
  })
  async getOrderByDeliveryId(
    @Req() req: any,
    @Param('deliveryId') deliveryId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrderByDeliveryId(deliveryId, req.user.userId);
  }
}
