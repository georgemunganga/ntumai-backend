import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeliveryService } from '../../application/services/delivery.service';
import {
  CreateDeliveryDto,
  AttachPricingDto,
  SetPaymentMethodDto,
  CancelDeliveryDto,
  AcceptDeliveryDto,
} from '../../application/dtos/create-delivery.dto';
import { JwtAuthGuard } from '../../../modules/auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../shared/common/decorators/public.decorator';

@ApiTags('Deliveries')
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Delivery',
    description:
      'Create a new delivery order. Works independently or can be linked to marketplace orders via marketplace_order_id.',
  })
  @ApiResponse({
    status: 201,
    description: 'Delivery created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  async createDelivery(
    @Body() dto: CreateDeliveryDto,
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user.userId;
    const userRole = req.user.role || 'customer';
    return this.deliveryService.createDelivery(dto, userId, userRole);
  }

  @Post(':id/attach-pricing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Attach Pricing',
    description:
      'Attach pricing calculator result with HMAC signature. Verifies signature and TTL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing attached successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or expired pricing',
  })
  async attachPricing(
    @Param('id') id: string,
    @Body() dto: AttachPricingDto,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.attachPricing(id, dto, req.user.userId);
  }

  @Post(':id/set-payment-method')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set Payment Method',
    description: 'Choose payment method for the delivery',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method set successfully',
  })
  async setPaymentMethod(
    @Param('id') id: string,
    @Body() dto: SetPaymentMethodDto,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.setPaymentMethod(id, dto, req.user.userId);
  }

  @Post(':id/preflight')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preflight Submit',
    description:
      'Verify pricing signature, TTL, and payment availability. Returns short-lived ready_token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preflight successful, ready to submit',
  })
  @ApiResponse({
    status: 400,
    description: 'Preflight failed - missing pricing or payment method',
  })
  async preflight(@Param('id') id: string, @Request() req: any): Promise<any> {
    return this.deliveryService.preflight(id, req.user.userId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit Delivery',
    description:
      'Final submission with ready_token. Triggers dispatch and tracking.',
  })
  @ApiHeader({
    name: 'X-Ready-Token',
    required: true,
    description: 'Ready token from preflight',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional idempotency key',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired ready token',
  })
  async submitDelivery(
    @Param('id') id: string,
    @Headers('x-ready-token') readyToken: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.submitDelivery(
      id,
      readyToken,
      req.user.userId,
      idempotencyKey,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Delivery',
    description: 'Get delivery details by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery not found',
  })
  async getDelivery(@Param('id') id: string): Promise<any> {
    return this.deliveryService.getDeliveryById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List Deliveries',
    description: 'Get user deliveries with filters and pagination',
  })
  @ApiQuery({ name: 'role', required: false, example: 'customer' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Deliveries retrieved successfully',
  })
  async listDeliveries(
    @Request() req: any,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ): Promise<any> {
    return this.deliveryService.getMyDeliveries(
      req.user.userId,
      role || req.user.role || 'customer',
      page || 1,
      size || 20,
    );
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel Delivery',
    description: 'Cancel a delivery with reason',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery cancelled successfully',
  })
  async cancelDelivery(
    @Param('id') id: string,
    @Body() dto: CancelDeliveryDto,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.cancelDelivery(id, req.user.userId, dto.reason);
  }

  @Get('config/vehicle-types')
  @Public()
  @ApiOperation({
    summary: 'Get Vehicle Types',
    description: 'Get available vehicle types',
  })
  async getVehicleTypes(): Promise<any> {
    return {
      vehicle_types: ['motorbike', 'bicycle', 'walking', 'truck'],
    };
  }

  @Get('config/payment-methods')
  @Public()
  @ApiOperation({
    summary: 'Get Payment Methods',
    description: 'Get available payment methods',
  })
  async getPaymentMethods(): Promise<any> {
    return {
      payment_methods: [
        'cash_on_delivery',
        'mobile_money',
        'card',
        'wallet',
        'bank_transfer',
      ],
    };
  }

  @Get('config/delivery-limits')
  @Public()
  @ApiOperation({
    summary: 'Get Delivery Limits',
    description: 'Get delivery configuration and limits',
  })
  async getDeliveryLimits(): Promise<any> {
    return this.deliveryService.getConfig();
  }
}

@ApiTags('Deliveries - Rider')
@Controller('rider/deliveries')
export class RiderDeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Nearby Deliveries',
    description: 'Get available deliveries near rider location',
  })
  @ApiQuery({ name: 'near_lat', required: true, example: -15.41 })
  @ApiQuery({ name: 'near_lng', required: true, example: 28.28 })
  @ApiQuery({ name: 'radius_km', required: false, example: 10 })
  @ApiQuery({ name: 'vehicle_type', required: false, example: 'motorbike' })
  @ApiResponse({
    status: 200,
    description: 'Nearby deliveries retrieved',
  })
  async getNearbyDeliveries(
    @Query('near_lat') lat: number,
    @Query('near_lng') lng: number,
    @Query('radius_km') radius?: number,
    @Query('vehicle_type') vehicleType?: string,
  ): Promise<any> {
    return this.deliveryService.getNearbyDeliveries(
      Number(lat),
      Number(lng),
      Number(radius) || 10,
      vehicleType,
    );
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept Delivery',
    description: 'Rider accepts a delivery',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery accepted',
  })
  async acceptDelivery(
    @Param('id') id: string,
    @Body() dto: AcceptDeliveryDto,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.acceptDelivery(id, req.user.userId);
  }

  @Post(':id/mark-delivery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark as Delivery',
    description: 'Mark order status as delivery (in transit)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
  })
  async markAsDelivery(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<any> {
    return this.deliveryService.markAsDelivery(id, req.user.userId);
  }
}
