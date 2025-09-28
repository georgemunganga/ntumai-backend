import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductListResponseDto } from '../product/product-response.dto';
import { CategoryListResponseDto } from '../category/category-response.dto';
import { BrandListResponseDto } from '../brand/brand-response.dto';
import { PromotionListResponseDto } from '../promotion/promotion-response.dto';

export class BannerDto {
  @ApiProperty({ description: 'Banner ID' })
  id: string;

  @ApiProperty({ description: 'Banner title' })
  title: string;

  @ApiPropertyOptional({ description: 'Banner subtitle' })
  subtitle?: string;

  @ApiProperty({ description: 'Banner image URL' })
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Banner link URL' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Call-to-action button text' })
  ctaText?: string;

  @ApiProperty({ description: 'Banner display order' })
  order: number;

  @ApiProperty({ description: 'Is banner active' })
  active: boolean;
}

export class FeaturedSectionDto {
  @ApiProperty({ description: 'Section ID' })
  id: string;

  @ApiProperty({ description: 'Section title' })
  title: string;

  @ApiPropertyOptional({ description: 'Section description' })
  description?: string;

  @ApiProperty({ description: 'Section type (e.g., products, categories, brands)' })
  type: string;

  @ApiProperty({ description: 'Section display order' })
  order: number;

  @ApiProperty({ description: 'Maximum items to display' })
  maxItems: number;

  @ApiProperty({ description: 'Is section active' })
  active: boolean;
}

export class HomeStatsDto {
  @ApiProperty({ description: 'Total products count' })
  totalProducts: number;

  @ApiProperty({ description: 'Total categories count' })
  totalCategories: number;

  @ApiProperty({ description: 'Total brands count' })
  totalBrands: number;

  @ApiProperty({ description: 'Total orders count' })
  totalOrders: number;

  @ApiProperty({ description: 'Total customers count' })
  totalCustomers: number;

  @ApiProperty({ description: 'Active promotions count' })
  activePromotions: number;
}

export class HomePageResponseDto {
  @ApiProperty({ description: 'Homepage banners', type: [BannerDto] })
  banners: BannerDto[];

  @ApiProperty({ description: 'Featured categories', type: [CategoryListResponseDto] })
  featuredCategories: CategoryListResponseDto[];

  @ApiProperty({ description: 'Featured brands', type: [BrandListResponseDto] })
  featuredBrands: BrandListResponseDto[];

  @ApiProperty({ description: 'Featured products', type: [ProductListResponseDto] })
  featuredProducts: ProductListResponseDto[];

  @ApiProperty({ description: 'New arrivals', type: [ProductListResponseDto] })
  newArrivals: ProductListResponseDto[];

  @ApiProperty({ description: 'Best sellers', type: [ProductListResponseDto] })
  bestSellers: ProductListResponseDto[];

  @ApiProperty({ description: 'On sale products', type: [ProductListResponseDto] })
  onSaleProducts: ProductListResponseDto[];

  @ApiProperty({ description: 'Trending products', type: [ProductListResponseDto] })
  trendingProducts: ProductListResponseDto[];

  @ApiProperty({ description: 'Active promotions', type: [PromotionListResponseDto] })
  activePromotions: PromotionListResponseDto[];

  @ApiProperty({ description: 'Featured sections configuration', type: [FeaturedSectionDto] })
  featuredSections: FeaturedSectionDto[];

  @ApiProperty({ description: 'Homepage statistics' })
  stats: HomeStatsDto;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

export class HomeConfigurationDto {
  @ApiProperty({ description: 'Site title' })
  siteTitle: string;

  @ApiProperty({ description: 'Site description' })
  siteDescription: string;

  @ApiPropertyOptional({ description: 'Site logo URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Site favicon URL' })
  faviconUrl?: string;

  @ApiProperty({ description: 'Primary color theme' })
  primaryColor: string;

  @ApiProperty({ description: 'Secondary color theme' })
  secondaryColor: string;

  @ApiProperty({ description: 'Maximum featured items per section' })
  maxFeaturedItems: number;

  @ApiProperty({ description: 'Enable product recommendations' })
  enableRecommendations: boolean;

  @ApiProperty({ description: 'Enable wishlist feature' })
  enableWishlist: boolean;

  @ApiProperty({ description: 'Enable product reviews' })
  enableReviews: boolean;

  @ApiProperty({ description: 'Default currency' })
  defaultCurrency: string;

  @ApiProperty({ description: 'Supported currencies', type: [String] })
  supportedCurrencies: string[];

  @ApiProperty({ description: 'Default language' })
  defaultLanguage: string;

  @ApiProperty({ description: 'Supported languages', type: [String] })
  supportedLanguages: string[];
}