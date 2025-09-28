import { Injectable, NotFoundException } from '@nestjs/common';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { MarketplaceBanner, MarketplaceBrand, MarketplaceCategory, MarketplaceProduct, MarketplaceStore } from './marketplace.types';

type ProductListResponse = {
  products: Array<ReturnType<MarketplaceService['mapProductSummary']>>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

@Injectable()
export class MarketplaceService {
  private readonly categories: MarketplaceCategory[] = [
    {
      id: 'fresh-produce',
      name: 'Fresh Produce',
      imageUrl: 'https://images.ntumai.com/categories/fresh-produce.jpg',
      productCount: 28,
      subcategories: [
        {
          id: 'fruits',
          name: 'Fruits',
          imageUrl: 'https://images.ntumai.com/categories/fruits.jpg',
          productCount: 12,
        },
        {
          id: 'vegetables',
          name: 'Vegetables',
          imageUrl: 'https://images.ntumai.com/categories/vegetables.jpg',
          productCount: 16,
        },
      ],
    },
    {
      id: 'household-essentials',
      name: 'Household Essentials',
      imageUrl: 'https://images.ntumai.com/categories/household.jpg',
      productCount: 32,
      subcategories: [
        {
          id: 'cleaning',
          name: 'Cleaning Supplies',
          imageUrl: 'https://images.ntumai.com/categories/cleaning.jpg',
          productCount: 14,
        },
        {
          id: 'laundry',
          name: 'Laundry',
          imageUrl: 'https://images.ntumai.com/categories/laundry.jpg',
          productCount: 18,
        },
      ],
    },
    {
      id: 'personal-care',
      name: 'Personal Care',
      imageUrl: 'https://images.ntumai.com/categories/personal-care.jpg',
      productCount: 21,
      subcategories: [
        {
          id: 'skin-care',
          name: 'Skin Care',
          imageUrl: 'https://images.ntumai.com/categories/skin-care.jpg',
          productCount: 11,
        },
        {
          id: 'hair-care',
          name: 'Hair Care',
          imageUrl: 'https://images.ntumai.com/categories/hair-care.jpg',
          productCount: 10,
        },
      ],
    },
  ];

  private readonly banners: MarketplaceBanner[] = [
    {
      id: 'banner-1',
      imageUrl: 'https://images.ntumai.com/banners/weekend-groceries.jpg',
      title: 'Weekend Savings',
      subtitle: 'Get up to 25% off on groceries',
      actionText: 'Shop Now',
      actionUrl: '/marketplace/categories/fresh-produce',
      type: 'discount',
    },
    {
      id: 'banner-2',
      imageUrl: 'https://images.ntumai.com/banners/new-arrivals.jpg',
      title: 'New Arrivals',
      subtitle: 'Discover the latest products from local vendors',
      actionText: 'Explore',
      actionUrl: '/marketplace/new-arrivals',
      type: 'new',
    },
  ];

  private readonly stores: MarketplaceStore[] = [
    {
      id: 'store-freshmart',
      name: 'FreshMart Grocery',
      imageUrl: 'https://images.ntumai.com/stores/freshmart.jpg',
      rating: 4.7,
      productCount: 128,
      vendorId: 'vendor-101',
    },
    {
      id: 'store-cleanliving',
      name: 'CleanLiving Supplies',
      imageUrl: 'https://images.ntumai.com/stores/cleanliving.jpg',
      rating: 4.5,
      productCount: 86,
      vendorId: 'vendor-102',
    },
    {
      id: 'store-beautyhub',
      name: 'BeautyHub Cosmetics',
      imageUrl: 'https://images.ntumai.com/stores/beautyhub.jpg',
      rating: 4.8,
      productCount: 64,
      vendorId: 'vendor-103',
    },
  ];

  private readonly brands: MarketplaceBrand[] = [
    {
      id: 'brand-sunshine',
      name: 'Sunshine Farms',
      imageUrl: 'https://images.ntumai.com/brands/sunshine-farms.jpg',
    },
    {
      id: 'brand-cleansafe',
      name: 'CleanSafe',
      imageUrl: 'https://images.ntumai.com/brands/cleansafe.jpg',
    },
    {
      id: 'brand-pureglow',
      name: 'PureGlow',
      imageUrl: 'https://images.ntumai.com/brands/pureglow.jpg',
    },
  ];

  private readonly products: MarketplaceProduct[] = [
    {
      id: 'product-apple-1kg',
      name: 'Organic Apples (1kg)',
      description: 'Freshly harvested organic apples from Sunshine Farms.',
      price: 6.5,
      discountedPrice: 5.2,
      discountPercentage: 20,
      imageUrl: 'https://images.ntumai.com/products/apples.jpg',
      rating: 4.9,
      reviewCount: 142,
      storeId: 'store-freshmart',
      categoryId: 'fruits',
      brandId: 'brand-sunshine',
      tags: ['organic', 'fruit', 'healthy'],
      isInStock: true,
      stockQuantity: 38,
      createdAt: '2024-01-10T08:00:00.000Z',
      relatedProductIds: ['product-apple-juice', 'product-banana-bunch'],
      variants: [
        {
          id: 'variant-size',
          name: 'Package Size',
          options: ['500g', '1kg', '2kg'],
        },
      ],
    },
    {
      id: 'product-banana-bunch',
      name: 'Sweet Banana Bunch',
      description: 'Naturally ripened bananas perfect for smoothies and snacks.',
      price: 4,
      discountedPrice: 3.6,
      discountPercentage: 10,
      imageUrl: 'https://images.ntumai.com/products/bananas.jpg',
      rating: 4.7,
      reviewCount: 98,
      storeId: 'store-freshmart',
      categoryId: 'fruits',
      brandId: 'brand-sunshine',
      tags: ['fruit', 'smoothie'],
      isInStock: true,
      stockQuantity: 52,
      createdAt: '2024-02-05T08:00:00.000Z',
      relatedProductIds: ['product-apple-1kg'],
      variants: [
        {
          id: 'variant-ripeness',
          name: 'Ripeness Level',
          options: ['Green', 'Ripe'],
        },
      ],
    },
    {
      id: 'product-apple-juice',
      name: 'Cold Pressed Apple Juice',
      description: 'Pure apple juice with no added sugar, cold pressed for freshness.',
      price: 8.5,
      discountedPrice: 7.4,
      discountPercentage: 13,
      imageUrl: 'https://images.ntumai.com/products/apple-juice.jpg',
      rating: 4.6,
      reviewCount: 77,
      storeId: 'store-freshmart',
      categoryId: 'fresh-produce',
      brandId: 'brand-sunshine',
      tags: ['juice', 'organic'],
      isInStock: true,
      stockQuantity: 24,
      createdAt: '2024-03-12T08:00:00.000Z',
      relatedProductIds: ['product-apple-1kg'],
      variants: [
        {
          id: 'variant-size',
          name: 'Bottle Size',
          options: ['250ml', '500ml', '1L'],
        },
      ],
    },
    {
      id: 'product-cleaner',
      name: 'Multi-Surface Cleaner',
      description: 'Eco-friendly cleaner for all household surfaces.',
      price: 9.75,
      discountedPrice: 8.25,
      discountPercentage: 15,
      imageUrl: 'https://images.ntumai.com/products/cleaner.jpg',
      rating: 4.5,
      reviewCount: 62,
      storeId: 'store-cleanliving',
      categoryId: 'cleaning',
      brandId: 'brand-cleansafe',
      tags: ['cleaning', 'eco-friendly'],
      isInStock: true,
      stockQuantity: 45,
      createdAt: '2024-01-28T08:00:00.000Z',
      relatedProductIds: ['product-detergent'],
      variants: [
        {
          id: 'variant-scent',
          name: 'Scent',
          options: ['Citrus', 'Lavender', 'Unscented'],
        },
      ],
    },
    {
      id: 'product-detergent',
      name: 'Concentrated Laundry Detergent',
      description: 'Powerful stain remover suitable for all fabrics.',
      price: 12,
      discountedPrice: 10.2,
      discountPercentage: 15,
      imageUrl: 'https://images.ntumai.com/products/detergent.jpg',
      rating: 4.4,
      reviewCount: 88,
      storeId: 'store-cleanliving',
      categoryId: 'laundry',
      brandId: 'brand-cleansafe',
      tags: ['laundry', 'cleaning'],
      isInStock: true,
      stockQuantity: 31,
      createdAt: '2024-02-15T08:00:00.000Z',
      relatedProductIds: ['product-cleaner'],
      variants: [
        {
          id: 'variant-size',
          name: 'Package Size',
          options: ['1L', '2L', '4L'],
        },
      ],
    },
    {
      id: 'product-serum',
      name: 'Vitamin C Brightening Serum',
      description: 'Dermatologist-approved serum for glowing skin.',
      price: 25,
      discountedPrice: 22.5,
      discountPercentage: 10,
      imageUrl: 'https://images.ntumai.com/products/serum.jpg',
      rating: 4.8,
      reviewCount: 156,
      storeId: 'store-beautyhub',
      categoryId: 'skin-care',
      brandId: 'brand-pureglow',
      tags: ['skincare', 'vitamin-c'],
      isInStock: true,
      stockQuantity: 20,
      createdAt: '2024-02-20T08:00:00.000Z',
      relatedProductIds: ['product-cleanser'],
      variants: [
        {
          id: 'variant-size',
          name: 'Bottle Size',
          options: ['30ml', '50ml'],
        },
      ],
    },
    {
      id: 'product-cleanser',
      name: 'Gentle Foaming Cleanser',
      description: 'Hydrating cleanser suitable for all skin types.',
      price: 18,
      discountedPrice: 15.3,
      discountPercentage: 15,
      imageUrl: 'https://images.ntumai.com/products/cleanser.jpg',
      rating: 4.6,
      reviewCount: 121,
      storeId: 'store-beautyhub',
      categoryId: 'skin-care',
      brandId: 'brand-pureglow',
      tags: ['skincare', 'cleanser'],
      isInStock: true,
      stockQuantity: 27,
      createdAt: '2024-01-18T08:00:00.000Z',
      relatedProductIds: ['product-serum'],
      variants: [
        {
          id: 'variant-size',
          name: 'Bottle Size',
          options: ['100ml', '200ml'],
        },
      ],
    },
  ];

  private readonly favorites = new Set<string>();

  getMarketplaceOverview() {
    const trendingProducts = [...this.products]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map((product) => this.mapProductSummary(product));

    const stores = this.stores.map((store) => ({
      id: store.id,
      name: store.name,
      vendorId: store.vendorId,
      imageUrl: store.imageUrl,
      rating: store.rating,
      productCount: store.productCount,
    }));

    return {
      categories: this.categories.map((category) => ({
        id: category.id,
        name: category.name,
        imageUrl: category.imageUrl,
        productCount: category.productCount,
      })),
      banners: this.banners,
      trendingProducts,
      stores,
    };
  }

  getCategories() {
    return {
      categories: this.categories,
    };
  }

  getCategoryProducts(categoryId: string, query: ProductQueryDto): ProductListResponse {
    const categoryIds = this.collectCategoryIds(categoryId);
    const products = this.products.filter((product) => categoryIds.has(product.categoryId));

    return this.buildProductListResponse(products, query);
  }

  getBrands() {
    const counts = this.products.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.brandId] = (accumulator[product.brandId] || 0) + 1;
      return accumulator;
    }, {});

    return {
      brands: this.brands.map((brand) => ({
        ...brand,
        productCount: counts[brand.id] ?? 0,
      })),
    };
  }

  getBrandProducts(brandId: string, query: ProductQueryDto): ProductListResponse {
    const products = this.products.filter((product) => product.brandId === brandId);
    return this.buildProductListResponse(products, query);
  }

  searchProducts(query: SearchProductsDto): ProductListResponse {
    const normalizedQuery = query.query.trim().toLowerCase();
    const products = this.products.filter((product) => {
      const searchHaystack = [
        product.name,
        product.description,
        ...product.tags,
        this.getStoreById(product.storeId)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchHaystack.includes(normalizedQuery);
    });

    return this.buildProductListResponse(products, query);
  }

  getProduct(productId: string) {
    const product = this.products.find((item) => item.id === productId);

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} was not found`);
    }

    const store = this.getStoreById(product.storeId);
    const category = this.findCategory(product.categoryId);
    const brand = this.brands.find((item) => item.id === product.brandId);
    const relatedProducts = product.relatedProductIds
      .map((id) => this.products.find((item) => item.id === id))
      .filter((item): item is MarketplaceProduct => Boolean(item))
      .map((related) => ({
        id: related.id,
        name: related.name,
        price: related.price,
        discountedPrice: related.discountedPrice,
        imageUrl: related.imageUrl,
        isFavorite: this.favorites.has(related.id),
      }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountPercentage,
      images: [product.imageUrl],
      rating: product.rating,
      reviewCount: product.reviewCount,
      store: store
        ? {
            id: store.id,
            name: store.name,
            imageUrl: store.imageUrl,
            rating: store.rating,
          }
        : undefined,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : undefined,
      brand: brand
        ? {
            id: brand.id,
            name: brand.name,
          }
        : undefined,
      tags: product.tags,
      variants: product.variants,
      isFavorite: this.favorites.has(product.id),
      isInStock: product.isInStock,
      stockQuantity: product.stockQuantity,
      relatedProducts,
      reviews: this.buildSampleReviews(product),
    };
  }

  toggleFavorite(productId: string) {
    if (!this.products.some((product) => product.id === productId)) {
      throw new NotFoundException(`Product with id ${productId} was not found`);
    }

    let isFavorite: boolean;
    if (this.favorites.has(productId)) {
      this.favorites.delete(productId);
      isFavorite = false;
    } else {
      this.favorites.add(productId);
      isFavorite = true;
    }

    return {
      success: true,
      isFavorite,
      message: isFavorite ? 'Product added to favorites' : 'Product removed from favorites',
    };
  }

  getFavoriteProducts(query: FavoritesQueryDto): ProductListResponse {
    const products = this.products.filter((product) => this.favorites.has(product.id));
    return this.buildProductListResponse(products, query);
  }

  private buildProductListResponse(products: MarketplaceProduct[], query: ProductQueryDto): ProductListResponse {
    const { page = 1, limit = 10, sort, filter } = query;

    const filteredProducts = this.applyFilters(products, filter);
    const sortedProducts = this.sortProducts(filteredProducts, sort);
    const { paginatedItems, totalPages, currentPage } = this.paginate(sortedProducts, page, limit);

    return {
      products: paginatedItems.map((product) => this.mapProductSummary(product)),
      pagination: {
        total: filteredProducts.length,
        page: currentPage,
        limit,
        pages: totalPages,
      },
    };
  }

  private applyFilters(products: MarketplaceProduct[], filter?: string) {
    if (!filter) {
      return products;
    }

    let parsedFilter: Record<string, unknown>;

    try {
      parsedFilter = JSON.parse(filter);
    } catch (error) {
      return products;
    }

    return products.filter((product) => {
      const matchesStore = parsedFilter.storeId ? product.storeId === String(parsedFilter.storeId) : true;
      const matchesCategory = parsedFilter.categoryId ? product.categoryId === String(parsedFilter.categoryId) : true;
      const matchesPriceMin = parsedFilter.minPrice ? product.discountedPrice >= Number(parsedFilter.minPrice) : true;
      const matchesPriceMax = parsedFilter.maxPrice ? product.discountedPrice <= Number(parsedFilter.maxPrice) : true;
      const matchesInStock =
        parsedFilter.onlyInStock !== undefined ? product.isInStock === this.toBoolean(parsedFilter.onlyInStock) : true;
      const matchesFavorites =
        parsedFilter.onlyFavorites !== undefined
          ? this.favorites.has(product.id) === this.toBoolean(parsedFilter.onlyFavorites)
          : true;

      return (
        matchesStore &&
        matchesCategory &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesInStock &&
        matchesFavorites
      );
    });
  }

  private sortProducts(products: MarketplaceProduct[], sort?: ProductQueryDto['sort']) {
    if (!sort) {
      return products;
    }

    const sorted = [...products];

    switch (sort) {
      case 'price_asc':
        return sorted.sort((a, b) => a.discountedPrice - b.discountedPrice);
      case 'price_desc':
        return sorted.sort((a, b) => b.discountedPrice - a.discountedPrice);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return products;
    }
  }

  private paginate(products: MarketplaceProduct[], page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(products.length / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;
    const end = start + limit;

    return {
      paginatedItems: products.slice(start, end),
      totalPages,
      currentPage: safePage,
    };
  }

  private mapProductSummary(product: MarketplaceProduct) {
    const store = this.getStoreById(product.storeId);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountPercentage,
      imageUrl: product.imageUrl,
      rating: product.rating,
      reviewCount: product.reviewCount,
      store: store
        ? {
            id: store.id,
            name: store.name,
            imageUrl: store.imageUrl,
          }
        : undefined,
      isFavorite: this.favorites.has(product.id),
    };
  }

  private getStoreById(storeId: string) {
    return this.stores.find((store) => store.id === storeId);
  }

  private findCategory(categoryId: string): MarketplaceCategory | undefined {
    const directCategory = this.categories.find((category) => category.id === categoryId);

    if (directCategory) {
      return directCategory;
    }

    for (const category of this.categories) {
      const subcategory = category.subcategories?.find((item) => item.id === categoryId);
      if (subcategory) {
        return subcategory;
      }
    }

    return undefined;
  }

  private collectCategoryIds(categoryId: string) {
    const directCategory = this.categories.find((category) => category.id === categoryId);

    if (directCategory) {
      const ids = new Set<string>([directCategory.id]);
      directCategory.subcategories?.forEach((subcategory) => ids.add(subcategory.id));
      return ids;
    }

    for (const category of this.categories) {
      const subcategory = category.subcategories?.find((item) => item.id === categoryId);
      if (subcategory) {
        return new Set<string>([subcategory.id]);
      }
    }

    return new Set<string>([categoryId]);
  }

  private toBoolean(value: unknown) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return Boolean(value);
  }

  private buildSampleReviews(product: MarketplaceProduct) {
    return [
      {
        id: `${product.id}-review-1`,
        user: {
          id: 'user-201',
          name: 'Amina K.',
          imageUrl: 'https://images.ntumai.com/users/amina.jpg',
        },
        rating: Math.min(5, product.rating),
        comment: 'Excellent quality and fast delivery. Highly recommended!',
        images: [product.imageUrl],
        createdAt: '2024-03-18T10:15:00.000Z',
      },
      {
        id: `${product.id}-review-2`,
        user: {
          id: 'user-202',
          name: 'James O.',
          imageUrl: 'https://images.ntumai.com/users/james.jpg',
        },
        rating: Math.max(4, Math.round(product.rating)),
        comment: 'Good value for money and great packaging.',
        images: [],
        createdAt: '2024-03-12T09:05:00.000Z',
      },
    ];
  }
}
