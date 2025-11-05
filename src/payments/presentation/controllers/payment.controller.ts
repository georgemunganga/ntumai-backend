import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from '../../application/services/payment.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  CollectCashDto,
} from '../../application/dtos/payment.dto';
import { Public } from '../../../shared/common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
@Public()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('methods')
  @ApiOperation({
    summary: 'List Available Payment Methods',
    description:
      'Get all available payment methods filtered by region and currency. Works independently or with deliveries/marketplace.',
  })
  @ApiQuery({ name: 'region', required: false, example: 'ZM-LSK' })
  @ApiQuery({ name: 'currency', required: false, example: 'ZMW' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  async listMethods(
    @Query('region') region?: string,
    @Query('currency') currency?: string,
  ): Promise<any> {
    const methods = await this.paymentService.listAvailableMethods(
      region,
      currency,
    );
    return { methods };
  }

  @Get('methods/:method/availability')
  @ApiOperation({
    summary: 'Check Method Availability',
    description: 'Check if a specific payment method is currently available',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability status retrieved',
  })
  async checkAvailability(@Param('method') method: string): Promise<any> {
    return this.paymentService.checkMethodAvailability(method);
  }

  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Payment Intent',
    description:
      'Create a payment intent for any amount. Can reference deliveries, marketplace orders, or be standalone.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or expired calc_sig',
  })
  async createIntent(@Body() dto: CreatePaymentIntentDto): Promise<any> {
    return this.paymentService.createIntent(dto);
  }

  @Post('intents/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm Payment Intent',
    description:
      'Select payment method and confirm. Creates session and initiates payment flow.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed, session created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid method or cannot confirm',
  })
  async confirmIntent(
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentIntentDto,
  ): Promise<any> {
    return this.paymentService.confirmIntent(id, dto);
  }

  @Get('intents/:id')
  @ApiOperation({
    summary: 'Get Payment Intent',
    description: 'Get payment intent details with all sessions',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment intent not found',
  })
  async getIntent(@Param('id') id: string): Promise<any> {
    return this.paymentService.getIntent(id);
  }

  @Get('sessions/:id')
  @ApiOperation({
    summary: 'Get Payment Session',
    description: 'Get payment session details including next_action',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment session retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment session not found',
  })
  async getSession(@Param('id') id: string): Promise<any> {
    return this.paymentService.getSession(id);
  }

  @Post('intents/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel Payment Intent',
    description: 'Cancel a pending payment intent',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent cancelled',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel in current state',
  })
  async cancelIntent(@Param('id') id: string): Promise<any> {
    return this.paymentService.cancelIntent(id);
  }

  @Post('intents/:id/collect-cash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Collect Cash (COD)',
    description:
      'Mark cash as collected by rider. Only for cash_on_delivery intents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash collection recorded',
  })
  @ApiResponse({
    status: 400,
    description: 'Not a COD intent or amount mismatch',
  })
  async collectCash(
    @Param('id') id: string,
    @Body() dto: CollectCashDto,
  ): Promise<any> {
    return this.paymentService.collectCash(id, dto);
  }
}
