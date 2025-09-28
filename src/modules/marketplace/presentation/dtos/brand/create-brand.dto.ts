import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BrandStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export class CreateBrandDto {
  @ApiProperty({ description: 'Brand name', example: 'Apple' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Brand description', example: 'Premium technology products' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Brand website URL' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Brand status', enum: BrandStatus, default: BrandStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BrandStatus)
  status?: BrandStatus;

  @ApiPropertyOptional({ description: 'Is brand featured', default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  metaDescription?: string;
}