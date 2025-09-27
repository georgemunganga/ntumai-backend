import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from './create-product.dto';

export class ProductVariantResponseDto {
  @ApiProperty({ description: 'Variant ID' })
  id: string;

  @ApiProperty({ description: 'Variant name' })
  name: string;

  @ApiProperty({ description: 'Variant value' })
  value: string;

  @ApiPropertyOptional({ description: 'Additional price for this variant' })
  additionalPrice?: number;

  @ApiPropertyOptional({ description: 'Stock quantity for this variant' })
  stock?: number;
}

export class ProductSpecificationResponseDto {
  @ApiProperty({ description: 'Specification name' })
  name: string;

  @ApiProperty({ description: 'Specification value' })
  value: string;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  imageUrl?: string;
}

export class BrandResponseDto {
  @ApiProperty({ description: 'Brand ID' })
  id: string;

  @ApiProperty({ description: 'Brand name' })
  name: string;

  @ApiProperty({ description: 'Brand slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  logoUrl?: string;
}

export class StoreResponseDto {
  @ApiProperty({ description: 'Store ID' })
  id: string;

  @ApiProperty({ description: 'Store name' })
  name: string;

  @ApiProperty({ description: 'Store slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Store logo URL' })
  logoUrl?: string;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiPropertyOptional({ description: 'Short product description' })
  shortDescription?: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiPropertyOptional({ description: 'Compare at price (original price)' })
  compareAtPrice?: number;

  @ApiPropertyOptional({ description: 'Cost price' })
  costPrice?: number;

  @ApiProperty({ description: 'Category information' })
  category: CategoryResponseDto;

  @ApiPropertyOptional({ description: 'Brand information' })
  brand?: BrandResponseDto;

  @ApiProperty({ description: 'Store information' })
  store: StoreResponseDto;

  @ApiProperty({ description: 'Stock quantity' })
  stock: number;

  @ApiProperty({ description: 'Low stock threshold' })
  lowStockThreshold: number;

  @ApiPropertyOptional({ description: 'Product weight in grams' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Product dimensions' })
  dimensions?: string;

  @ApiProperty({ description: 'Product images', type: [String] })
  images: string[];

  @ApiProperty({ description: 'Product tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Product variants', type: [ProductVariantResponseDto] })
  variants: ProductVariantResponseDto[];

  @ApiProperty({ description: 'Product specifications', type: [ProductSpecificationResponseDto] })
  specifications: ProductSpecificationResponseDto[];

  @ApiProperty({ description: 'Product status', enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ description: 'Is product featured' })
  featured: boolean;

  @ApiProperty({ description: 'Track inventory' })
  trackInventory: boolean;

  @ApiProperty({ description: 'Allow backorders' })
  allowBackorders: boolean;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews count' })
  reviewCount: number;

  @ApiProperty({ description: 'Total sales count' })
  salesCount: number;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  metaDescription?: string;

  @ApiProperty({ description: 'SEO meta keywords', type: [String] })
  metaKeywords: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Short product description' })
  shortDescription?: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiPropertyOptional({ description: 'Compare at price' })
  compareAtPrice?: number;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  brandName?: string;

  @ApiProperty({ description: 'Store name' })
  storeName: string;

  @ApiProperty({ description: 'Stock quantity' })
  stock: number;

  @ApiProperty({ description: 'Primary image URL' })
  primaryImage: string;

  @ApiProperty({ description: 'Product status', enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ description: 'Is product featured' })
  featured: boolean;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews count' })
  reviewCount: number;

  @ApiProperty({ description: 'Is product on sale' })
  onSale: boolean;

  @ApiProperty({ description: 'Discount percentage' })
  discountPercentage: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class ProductSearchResponseDto {
  @ApiProperty({ description: 'List of products', type: [ProductListResponseDto] })
  products: ProductListResponseDto[];

  @ApiProperty({ description: 'Total number of products found' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class ProductStatsResponseDto {
  @ApiProperty({ description: 'Total products count' })
  totalProducts: number;

  @ApiProperty({ description: 'Active products count' })
  activeProducts: number;

  @ApiProperty({ description: 'Out of stock products count' })
  outOfStockProducts: number;

  @ApiProperty({ description: 'Low stock products count' })
  lowStockProducts: number;

  @ApiProperty({ description: 'Featured products count' })
  featuredProducts: number;

  @ApiProperty({ description: 'Average product rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total product views' })
  totalViews: number;

  @ApiProperty({ description: 'Total sales' })
  totalSales: number;
}