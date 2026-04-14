import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  PaymentMethodListResponseDto,
  PaymentMethodMutationResponseDto,
  UpdatePaymentMethodDto,
  UpsertPaymentMethodDto,
} from '../../application/dtos/payment-methods.dto';
import { PaymentMethodsService } from '../../application/services/payment-methods.service';

@ApiTags('Payment Methods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/payments/methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List customer payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods loaded successfully',
    type: PaymentMethodListResponseDto,
  })
  async list(@Req() req: any) {
    return this.paymentMethodsService.list(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a customer payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method created successfully',
    type: PaymentMethodMutationResponseDto,
  })
  async create(@Req() req: any, @Body() dto: UpsertPaymentMethodDto) {
    return this.paymentMethodsService.create(req.user.userId, dto);
  }

  @Patch(':methodId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a customer payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
    type: PaymentMethodMutationResponseDto,
  })
  async update(
    @Req() req: any,
    @Param('methodId') methodId: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(req.user.userId, methodId, dto);
  }

  @Patch(':methodId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a customer payment method as default' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method updated successfully',
    type: PaymentMethodListResponseDto,
  })
  async setDefault(@Req() req: any, @Param('methodId') methodId: string) {
    return this.paymentMethodsService.setDefault(req.user.userId, methodId);
  }

  @Delete(':methodId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method removed successfully',
    type: PaymentMethodListResponseDto,
  })
  async remove(@Req() req: any, @Param('methodId') methodId: string) {
    return this.paymentMethodsService.remove(req.user.userId, methodId);
  }
}
