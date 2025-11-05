import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrdersQueryDto {
  @ApiPropertyOptional({
    example: 'marketplace',
    enum: ['marketplace', 'delivery'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['marketplace', 'delivery'])
  type?: string;

  @ApiPropertyOptional({
    example: 'completed',
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  marketplace_order_id: string | null;

  @ApiPropertyOptional()
  delivery_id: string | null;

  @ApiPropertyOptional()
  booking_id: string | null;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  items_summary: string;

  @ApiPropertyOptional()
  delivery_address: string | null;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

  @ApiPropertyOptional()
  completed_at: string | null;
}

export class OrdersListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  total_pages: number;
}
