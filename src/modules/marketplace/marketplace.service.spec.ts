import { NotFoundException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(() => {
    service = new MarketplaceService();
  });

  it('should provide marketplace overview data', () => {
    const overview = service.getMarketplaceOverview();

    expect(overview.categories.length).toBeGreaterThan(0);
    expect(overview.banners.length).toBeGreaterThan(0);
    expect(overview.trendingProducts.length).toBeGreaterThan(0);
    expect(overview.stores.length).toBeGreaterThan(0);
  });

  it('should return products for a category including subcategories', () => {
    const result = service.getCategoryProducts('fresh-produce', { page: 1, limit: 10 });

    expect(result.products.length).toBeGreaterThan(0);
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it('should return products for a brand', () => {
    const result = service.getBrandProducts('brand-sunshine', { page: 1, limit: 10 });

    expect(result.products.every((product) => product.store?.name)).toBeTruthy();
  });

  it('should search products by query', () => {
    const result = service.searchProducts({ query: 'apple', page: 1, limit: 10 });

    expect(result.products.some((product) => product.name.toLowerCase().includes('apple'))).toBe(true);
  });

  it('should retrieve a single product with details', () => {
    const product = service.getProduct('product-apple-1kg');

    expect(product.id).toBe('product-apple-1kg');
    expect(product.store?.id).toBeDefined();
    expect(product.reviews.length).toBeGreaterThan(0);
  });

  it('should toggle favorite state for a product', () => {
    const firstToggle = service.toggleFavorite('product-apple-1kg');
    const favorites = service.getFavoriteProducts({ page: 1, limit: 10 });
    const secondToggle = service.toggleFavorite('product-apple-1kg');

    expect(firstToggle.isFavorite).toBe(true);
    expect(favorites.products.some((product) => product.id === 'product-apple-1kg')).toBe(true);
    expect(secondToggle.isFavorite).toBe(false);
  });

  it('should throw when toggling favorite for unknown product', () => {
    expect(() => service.toggleFavorite('unknown')).toThrow(NotFoundException);
  });
});
