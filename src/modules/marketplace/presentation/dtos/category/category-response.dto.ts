import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from './create-category.dto';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiProperty({ description: 'Category description' })
  description: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Parent category name' })
  parentName?: string;

  @ApiProperty({ description: 'Category level in hierarchy' })
  level: number;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Category status', enum: CategoryStatus })
  status: CategoryStatus;

  @ApiProperty({ description: 'Number of products in this category' })
  productCount: number;

  @ApiProperty({ description: 'Number of subcategories' })
  subcategoryCount: number;

  @ApiPropertyOptional({ description: 'SEO meta title' })
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  metaDescription?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class CategoryListResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Parent category name' })
  parentName?: string;

  @ApiProperty({ description: 'Category level in hierarchy' })
  level: number;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Category status', enum: CategoryStatus })
  status: CategoryStatus;

  @ApiProperty({ description: 'Number of products in this category' })
  productCount: number;

  @ApiProperty({ description: 'Number of subcategories' })
  subcategoryCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class CategoryHierarchyResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Category level in hierarchy' })
  level: number;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Number of products in this category' })
  productCount: number;

  @ApiProperty({ description: 'Subcategories', type: [CategoryHierarchyResponseDto] })
  subcategories: CategoryHierarchyResponseDto[];
}

export class CategoryStatsResponseDto {
  @ApiProperty({ description: 'Total categories count' })
  totalCategories: number;

  @ApiProperty({ description: 'Active categories count' })
  activeCategories: number;

  @ApiProperty({ description: 'Root categories count' })
  rootCategories: number;

  @ApiProperty({ description: 'Categories with products count' })
  categoriesWithProducts: number;

  @ApiProperty({ description: 'Empty categories count' })
  emptyCategories: number;

  @ApiProperty({ description: 'Maximum hierarchy depth' })
  maxDepth: number;

  @ApiProperty({ description: 'Average products per category' })
  averageProductsPerCategory: number;
}