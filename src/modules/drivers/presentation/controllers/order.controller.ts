import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { OrderService } from '../../application/services/order.service';
import {
  AcceptOrderDto,
  RejectOrderDto,
  UpdateOrderStatusDto,
  PickupOrderDto,
  DeliverOrderDto,
  CancelOrderDto,
  OrderResponseDto,
  GetOrdersDto,
  PaginatedOrdersResponseDto,
  FindNearbyOrdersDto,
  NearbyOrderDto,
  OrderSummaryDto,
} from '../dtos';

@ApiTags('Order Management')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('nearby')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Find nearby available orders' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearby orders retrieved successfully',
    type: [NearbyOrderDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid location or search parameters',
  })
  async findNearbyOrders(
    @Request() req: any,
    @Query() findNearbyDto: FindNearbyOrdersDto,
  ): Promise<NearbyOrderDto[]> {
    const riderId = req.user.id;
    return this.orderService.findNearbyOrders(riderId, findNearbyDto);
  }

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider orders' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully',
    type: PaginatedOrdersResponseDto,
  })
  async getRiderOrders(
    @Request() req: any,
    @Query() getOrdersDto: GetOrdersDto,
  ): Promise<PaginatedOrdersResponseDto> {
    const riderId = req.user.id;
    return this.orderService.getRiderOrders(riderId, getOrdersDto);
  }

  @Get('active')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get active orders for rider' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active orders retrieved successfully',
    type: [OrderResponseDto],
  })
  async getActiveOrders(@Request() req: any): Promise<OrderResponseDto[]> {
    const riderId = req.user.id;
    return this.orderService.getActiveOrders(riderId);
  }

  @Get(':orderId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getOrderById(
    @Request() req: any,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.orderService.getOrderById(orderId, riderId);
  }

  @Post(':orderId/accept')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Accept an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order accepted successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot accept order - order not available or rider not eligible',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Order already accepted by another rider',
  })
  async acceptOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() acceptOrderDto: AcceptOrderDto,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.id;
    return this.orderService.acceptOrder(orderId, riderId, acceptOrderDto);
  }

  @Post(':orderId/reject')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Reject an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order rejected successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot reject order - order not available for rejection',
  })
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() rejectOrderDto: RejectOrderDto,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.orderService.rejectOrder(orderId, riderId, rejectOrderDto);
  }

  @Put(':orderId/status')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update order status - order not assigned to rider',
  })
  async updateOrderStatus(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.id;
    return this.orderService.updateOrderStatus(orderId, riderId, updateStatusDto);
  }

  @Post(':orderId/pickup')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Mark order as picked up' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order marked as picked up successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot pickup order - order not ready for pickup',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot pickup order - order not assigned to rider',
  })
  async pickupOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() pickupOrderDto: PickupOrderDto,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.id;
    return this.orderService.pickupOrder(orderId, riderId, pickupOrderDto);
  }

  @Post(':orderId/deliver')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order delivered successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot deliver order - order not ready for delivery',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot deliver order - order not assigned to rider',
  })
  async deliverOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() deliverOrderDto: DeliverOrderDto,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.id;
    return this.orderService.deliverOrder(orderId, riderId, deliverOrderDto);
  }

  @Post(':orderId/cancel')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel order - order not eligible for cancellation',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot cancel order - order not assigned to rider',
  })
  async cancelOrder(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ): Promise<OrderResponseDto> {
    const riderId = req.user.id;
    return this.orderService.cancelOrder(orderId, riderId, cancelOrderDto);
  }

  @Get('history/completed')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get completed orders history' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date filter', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date filter', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Completed orders retrieved successfully',
    type: PaginatedOrdersResponseDto,
  })
  async getCompletedOrders(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedOrdersResponseDto> {
    const riderId = req.user.id;
    return this.orderService.getCompletedOrders(riderId, {
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('summary/daily')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get daily order summary' })
  @ApiQuery({ name: 'date', description: 'Date for summary (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily order summary retrieved successfully',
    type: OrderSummaryDto,
  })
  async getDailyOrderSummary(
    @Request() req: any,
    @Query('date') date?: string,
  ): Promise<OrderSummaryDto> {
    const riderId = req.user.id;
    const summaryDate = date ? new Date(date) : new Date();
    return this.orderService.getDailyOrderSummary(riderId, summaryDate);
  }

  @Get('summary/weekly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get weekly order summary' })
  @ApiQuery({ name: 'weekStart', description: 'Week start date (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly order summary retrieved successfully',
    type: OrderSummaryDto,
  })
  async getWeeklyOrderSummary(
    @Request() req: any,
    @Query('weekStart') weekStart?: string,
  ): Promise<OrderSummaryDto> {
    const riderId = req.user.id;
    const startDate = weekStart ? new Date(weekStart) : undefined;
    return this.orderService.getWeeklyOrderSummary(riderId, startDate);
  }

  @Get('summary/monthly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get monthly order summary' })
  @ApiQuery({ name: 'year', description: 'Year for summary', required: false })
  @ApiQuery({ name: 'month', description: 'Month for summary (1-12)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly order summary retrieved successfully',
    type: OrderSummaryDto,
  })
  async getMonthlyOrderSummary(
    @Request() req: any,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ): Promise<OrderSummaryDto> {
    const riderId = req.user.id;
    const currentDate = new Date();
    const summaryYear = year || currentDate.getFullYear();
    const summaryMonth = month || currentDate.getMonth() + 1;
    return this.orderService.getMonthlyOrderSummary(riderId, summaryYear, summaryMonth);
  }

  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all orders (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'customerId', description: 'Filter by customer ID', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by order status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllOrders(
    @Query('riderId') riderId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orderService.searchAllOrders({
      riderId,
      customerId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get order statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getOrderStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.orderService.getOrderStatistics(period);
  }

  @Post('bulk-assign')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk assign orders to riders (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders assigned successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk assignment data',
  })
  async bulkAssignOrders(
    @Body() bulkAssignData: {
      assignments: { orderId: string; riderId: string }[];
      reason?: string;
    },
  ): Promise<{ assigned: number; failed: string[] }> {
    return this.orderService.bulkAssignOrders(bulkAssignData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export order data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportOrders(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.orderService.exportOrders(format, parsedFilters);
  }

  @Get('analytics/performance')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get order performance analytics' })
  @ApiQuery({ name: 'period', description: 'Analytics period', required: false })
  @ApiQuery({ name: 'startDate', description: 'Start date for analytics', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date for analytics', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order analytics retrieved successfully',
  })
  async getOrderAnalytics(
    @Request() req: any,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.orderService.getOrderAnalytics(riderId, {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}