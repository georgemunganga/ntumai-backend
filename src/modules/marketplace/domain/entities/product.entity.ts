import { AggregateRoot } from '@nestjs/cqrs';
import { ProductId } from '../value-objects/product-id.vo';
import { ProductDetails } from '../value-objects/product-details.vo';
import { Price } from '../value-objects/price.vo';
import { Rating } from '../value-objects/rating.vo';
import { StoreId } from '../value-objects/store-id.vo';
import { CategoryId } from '../value-objects/category-id.vo';
import { BrandId } from '../value-objects/brand-id.vo';
import { ProductVariant } from '../value-objects/product-variant.vo';
import { ProductCreatedEvent } from '../events/product-created.event';
import { ProductUpdatedEvent } from '../events/product-updated.event';
import { ProductDeletedEvent } from '../events/product-deleted.event';

export interface ProductProps {
  id: ProductId;
  name: string;
  description: string;
  price: Price;
  discountedPrice?: Price;
  images: string[];
  storeId: StoreId;
  categoryId: CategoryId;
  brandId?: BrandId;
  tags: string[];
  variants: ProductVariant[];
  stockQuantity: number;
  isActive: boolean;
  rating: Rating;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot {
  private constructor(private readonly props: ProductProps) {
    super();
  }

  public static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>): Product {
    const productId = ProductId.generate();
    const now = new Date();
    
    const product = new Product({
      ...props,
      id: productId,
      rating: Rating.create(0, 0),
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    product.apply(new ProductCreatedEvent(productId.value, props.name, props.storeId.value));
    return product;
  }

  public static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // Getters
  get id(): ProductId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): Price {
    return this.props.price;
  }

  get discountedPrice(): Price | undefined {
    return this.props.discountedPrice;
  }

  get images(): string[] {
    return [...this.props.images];
  }

  get storeId(): StoreId {
    return this.props.storeId;
  }

  get categoryId(): CategoryId {
    return this.props.categoryId;
  }

  get brandId(): BrandId | undefined {
    return this.props.brandId;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get variants(): ProductVariant[] {
    return [...this.props.variants];
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get rating(): Rating {
    return this.props.rating;
  }

  get reviewCount(): number {
    return this.props.reviewCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateDetails(name: string, description: string, price: Price): void {
    this.props.name = name;
    this.props.description = description;
    this.props.price = price;
    this.props.updatedAt = new Date();

    this.apply(new ProductUpdatedEvent(this.props.id.value, name, price.amount));
  }

  public updateStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    this.props.stockQuantity = quantity;
    this.props.updatedAt = new Date();
  }

  public applyDiscount(discountedPrice: Price): void {
    if (discountedPrice.amount >= this.props.price.amount) {
      throw new Error('Discounted price must be less than original price');
    }
    this.props.discountedPrice = discountedPrice;
    this.props.updatedAt = new Date();
  }

  public removeDiscount(): void {
    this.props.discountedPrice = undefined;
    this.props.updatedAt = new Date();
  }

  public updateRating(newRating: number, totalReviews: number): void {
    this.props.rating = Rating.create(newRating, totalReviews);
    this.props.reviewCount = totalReviews;
    this.props.updatedAt = new Date();
  }

  public addImages(imageUrls: string[]): void {
    this.props.images.push(...imageUrls);
    this.props.updatedAt = new Date();
  }

  public removeImage(imageUrl: string): void {
    const index = this.props.images.indexOf(imageUrl);
    if (index > -1) {
      this.props.images.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public addVariant(variant: ProductVariant): void {
    this.props.variants.push(variant);
    this.props.updatedAt = new Date();
  }

  public removeVariant(variantId: string): void {
    this.props.variants = this.props.variants.filter(v => v.id !== variantId);
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public delete(): void {
    this.apply(new ProductDeletedEvent(this.props.id.value, this.props.storeId.value));
  }

  public isInStock(): boolean {
    return this.props.stockQuantity > 0 && this.props.isActive;
  }

  public getDiscountPercentage(): number {
    if (!this.props.discountedPrice) {
      return 0;
    }
    return Math.round(((this.props.price.amount - this.props.discountedPrice.amount) / this.props.price.amount) * 100);
  }

  public getCurrentPrice(): Price {
    return this.props.discountedPrice || this.props.price;
  }

  public canPurchase(quantity: number): boolean {
    return this.isInStock() && this.props.stockQuantity >= quantity;
  }

  public reserveStock(quantity: number): void {
    if (!this.canPurchase(quantity)) {
      throw new Error('Insufficient stock available');
    }
    this.props.stockQuantity -= quantity;
    this.props.updatedAt = new Date();
  }

  public releaseStock(quantity: number): void {
    this.props.stockQuantity += quantity;
    this.props.updatedAt = new Date();
  }

  public toSnapshot(): ProductProps {
    return {
      ...this.props,
      images: [...this.props.images],
      tags: [...this.props.tags],
      variants: [...this.props.variants],
    };
  }
}