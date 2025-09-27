import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandStatus } from './create-brand.dto';

export class BrandResponseDto {
  @ApiProperty({ description: 'Brand ID' })
  id: string;

  @ApiProperty({ description: 'Brand name' })
  name: string;

  @ApiProperty({ description: 'Brand slug' })
  slug: string;

  @ApiProperty({ description: 'Brand description' })
  description: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Brand website URL' })
  websiteUrl?: string;

  @ApiProperty({ description: 'Brand status', enum: BrandStatus })
  status: BrandStatus;

  @ApiProperty({ description: 'Is brand featured' })
  featured: boolean;

  @ApiProperty({ description: 'Number of products for this brand' })
  productCount: number;

  @ApiProperty({ description: 'Average rating of brand products' })
  averageRating: number;

  @ApiProperty({ description: 'Total sales for this brand' })
  totalSales: number;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  metaDescription?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class BrandListResponseDto {
  @ApiProperty({ description: 'Brand ID' })
  id: string;

  @ApiProperty({ description: 'Brand name' })
  name: string;

  @ApiProperty({ description: 'Brand slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  logoUrl?: string;

  @ApiProperty({ description: 'Brand status', enum: BrandStatus })
  status: BrandStatus;

  @ApiProperty({ description: 'Is brand featured' })
  featured: boolean;

  @ApiProperty({ description: 'Number of products for this brand' })
  productCount: number;

  @ApiProperty({ description: 'Average rating of brand products' })
  averageRating: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class BrandStatsResponseDto {
  @ApiProperty({ description: 'Total brands count' })
  totalBrands: number;

  @ApiProperty({ description: 'Active brands count' })
  activeBrands: number;

  @ApiProperty({ description: 'Featured brands count' })
  featuredBrands: number;

  @ApiProperty({ description: 'Brands with products count' })
  brandsWithProducts: number;

  @ApiProperty({ description: 'Empty brands count' })
  emptyBrands: number;

  @ApiProperty({ description: 'Average products per brand' })
  averageProductsPerBrand: number;

  @ApiProperty({ description: 'Top performing brand by sales' })
  topBrandBySales: string;

  @ApiProperty({ description: 'Top performing brand by rating' })
  topBrandByRating: string;
}