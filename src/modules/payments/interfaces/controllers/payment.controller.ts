import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentService } from '../../application/services/payment.service';
import { CreatePaymentDto, ProcessPaymentDto } from '../dtos/payment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('api/v1/payments')
// @UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async findById(@Param('id') id: string) {
    return this.paymentService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Initiate a new payment' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully.' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Put(':id/process')
  @ApiOperation({ summary: 'Process a payment after gateway confirmation' })
  @ApiResponse({ status: 200, description: 'Payment processed and completed successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async process(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPayment(id, processPaymentDto.transactionId);
  }
}
