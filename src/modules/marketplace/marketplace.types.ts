export interface MarketplaceCategory {
  id: string;
  name: string;
  imageUrl: string;
  productCount: number;
  subcategories?: MarketplaceCategory[];
}

export interface MarketplaceBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  actionText: string;
  actionUrl: string;
  type: 'discount' | 'new' | 'info';
}

export interface MarketplaceStore {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  productCount: number;
  vendorId: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  storeId: string;
  categoryId: string;
  brandId: string;
  tags: string[];
  isInStock: boolean;
  stockQuantity: number;
  createdAt: string;
  relatedProductIds: string[];
  variants: Array<{
    id: string;
    name: string;
    options: string[];
  }>;
}

export interface MarketplaceBrand {
  id: string;
  name: string;
  imageUrl: string;
  productCount?: number;
}
