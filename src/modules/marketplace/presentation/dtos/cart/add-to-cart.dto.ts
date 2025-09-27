import { IsString, IsNumber, IsOptional, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID to add to cart' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1, example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Selected product variant ID' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Additional options or customizations' })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Special notes or instructions' })
  @IsOptional()
  @IsString()
  notes?: string;
}