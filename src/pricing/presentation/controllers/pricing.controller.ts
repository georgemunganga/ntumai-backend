import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PricingCalculatorService } from '../../application/services/pricing-calculator.service';
import {
  CalculatePriceDto,
  CalculatePriceResponseDto,
} from '../../application/dtos/calculate-price.dto';
import { Public } from '../../../shared/common/decorators/public.decorator';

@ApiTags('Pricing Calculator')
@Controller('calc')
@Public()
export class PricingController {
  constructor(
    private readonly pricingCalculatorService: PricingCalculatorService,
  ) {}

  @Post('price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate Price',
    description:
      'Stateless price calculation with HMAC signature. Returns a signed fare breakdown.',
  })
  @ApiResponse({
    status: 200,
    description: 'Price calculated successfully',
    type: CalculatePriceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - validation errors',
  })
  @ApiResponse({
    status: 404,
    description: 'Rate table not found for region/vehicle combination',
  })
  async calculatePrice(
    @Body() dto: CalculatePriceDto,
  ): Promise<CalculatePriceResponseDto> {
    return this.pricingCalculatorService.calculatePrice(dto);
  }

  @Get('config/rates')
  @ApiOperation({
    summary: 'Get Rate Table',
    description:
      'Retrieve rate configuration for a specific region and vehicle type',
  })
  @ApiQuery({ name: 'region', example: 'ZM-LSK' })
  @ApiQuery({ name: 'vehicle_type', example: 'motorbike' })
  @ApiResponse({
    status: 200,
    description: 'Rate table retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Rate table not found',
  })
  async getRateTable(
    @Query('region') region: string,
    @Query('vehicle_type') vehicle_type: string,
  ): Promise<any> {
    return this.pricingCalculatorService.getRateTable(region, vehicle_type);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check if the pricing calculator service is available',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async health(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Availability Check',
    description:
      'Check if the pricing calculator is available for calculations',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is available',
  })
  async availability(): Promise<{ available: boolean }> {
    return { available: true };
  }
}
