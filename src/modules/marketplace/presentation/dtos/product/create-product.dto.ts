import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class ProductVariantDto {
  @ApiProperty({ description: 'Variant name (e.g., Size, Color)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Variant value (e.g., Large, Red)' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Additional price for this variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalPrice?: number;

  @ApiPropertyOptional({ description: 'Stock quantity for this variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}

export class ProductSpecificationDto {
  @ApiProperty({ description: 'Specification name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Specification value' })
  @IsString()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Premium Wireless Headphones' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description', example: 'High-quality wireless headphones with noise cancellation' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Short product description for listings' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ description: 'Product SKU', example: 'WH-1000XM4' })
  @IsString()
  sku: string;

  @ApiProperty({ description: 'Product price', example: 299.99, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Compare at price (original price)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Cost price', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ description: 'Stock quantity', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Low stock threshold', minimum: 0, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Product weight in grams', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Product dimensions (length x width x height in cm)' })
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional({ description: 'Product images URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Product tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Product variants', type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'Product specifications', type: [ProductSpecificationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];

  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Is product featured', default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Track inventory', default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Allow backorders', default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorders?: boolean;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'SEO meta keywords', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];
}