import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('Marketplace')
@Controller('api')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('customer/marketplace')
  getMarketplaceOverview() {
    return this.marketplaceService.getMarketplaceOverview();
  }

  @Get('categories')
  getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Get('categories/:categoryId/products')
  getCategoryProducts(@Param('categoryId') categoryId: string, @Query() query: ProductQueryDto) {
    return this.marketplaceService.getCategoryProducts(categoryId, query);
  }

  @Get('brands')
  getBrands() {
    return this.marketplaceService.getBrands();
  }

  @Get('brands/:brandId/products')
  getBrandProducts(@Param('brandId') brandId: string, @Query() query: ProductQueryDto) {
    return this.marketplaceService.getBrandProducts(brandId, query);
  }

  @Get('products/search')
  searchProducts(@Query() query: SearchProductsDto) {
    return this.marketplaceService.searchProducts(query);
  }

  @Get('products/:productId')
  getProduct(@Param('productId') productId: string) {
    return this.marketplaceService.getProduct(productId);
  }

  @Post('customer/favorites/toggle')
  toggleFavorite(@Body() body: ToggleFavoriteDto) {
    return this.marketplaceService.toggleFavorite(body.productId);
  }

  @Get('customer/favorites')
  getFavoriteProducts(@Query() query: FavoritesQueryDto) {
    return this.marketplaceService.getFavoriteProducts(query);
  }
}
