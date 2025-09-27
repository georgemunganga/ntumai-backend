import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemProductDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Product price' })
  price: number;

  @ApiProperty({ description: 'Primary product image' })
  primaryImage: string;

  @ApiProperty({ description: 'Available stock' })
  stock: number;

  @ApiProperty({ description: 'Store name' })
  storeName: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  brandName?: string;
}

export class CartItemVariantDto {
  @ApiProperty({ description: 'Variant ID' })
  id: string;

  @ApiProperty({ description: 'Variant name' })
  name: string;

  @ApiProperty({ description: 'Variant value' })
  value: string;

  @ApiPropertyOptional({ description: 'Additional price for this variant' })
  additionalPrice?: number;
}

export class CartItemResponseDto {
  @ApiProperty({ description: 'Cart item ID' })
  id: string;

  @ApiProperty({ description: 'Product information' })
  product: CartItemProductDto;

  @ApiPropertyOptional({ description: 'Selected variant information' })
  variant?: CartItemVariantDto;

  @ApiProperty({ description: 'Quantity in cart' })
  quantity: number;

  @ApiProperty({ description: 'Unit price (including variant price)' })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item' })
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Additional options or customizations' })
  options?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Special notes or instructions' })
  notes?: string;

  @ApiProperty({ description: 'Is item available (in stock)' })
  available: boolean;

  @ApiProperty({ description: 'Date when item was added to cart' })
  addedAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class CartSummaryDto {
  @ApiProperty({ description: 'Subtotal (sum of all item prices)' })
  subtotal: number;

  @ApiProperty({ description: 'Total discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping cost' })
  shippingCost: number;

  @ApiProperty({ description: 'Total amount' })
  total: number;

  @ApiProperty({ description: 'Total items count' })
  itemCount: number;

  @ApiProperty({ description: 'Total quantity of all items' })
  totalQuantity: number;

  @ApiProperty({ description: 'Estimated weight in grams' })
  estimatedWeight: number;
}

export class CartResponseDto {
  @ApiProperty({ description: 'Cart ID' })
  id: string;

  @ApiProperty({ description: 'User ID who owns the cart' })
  userId: string;

  @ApiProperty({ description: 'Cart items', type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Cart summary' })
  summary: CartSummaryDto;

  @ApiProperty({ description: 'Is cart active' })
  active: boolean;

  @ApiProperty({ description: 'Cart creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last activity date' })
  lastActivityAt?: Date;
}

export class CartValidationResponseDto {
  @ApiProperty({ description: 'Is cart valid for checkout' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation errors', type: [String] })
  errors: string[];

  @ApiProperty({ description: 'Validation warnings', type: [String] })
  warnings: string[];

  @ApiProperty({ description: 'Items that are out of stock', type: [String] })
  outOfStockItems: string[];

  @ApiProperty({ description: 'Items with insufficient stock', type: [String] })
  insufficientStockItems: string[];

  @ApiProperty({ description: 'Items with price changes', type: [String] })
  priceChangedItems: string[];

  @ApiProperty({ description: 'Updated cart summary' })
  updatedSummary: CartSummaryDto;
}