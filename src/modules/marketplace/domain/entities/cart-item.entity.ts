import { ProductId } from '../value-objects/product-id.vo';
import { StoreId } from '../value-objects/store-id.vo';
import { Price } from '../value-objects/price.vo';

export interface CartItemProps {
  id: string;
  productId: ProductId;
  productName: string;
  productImageUrl: string;
  storeId: StoreId;
  price: Price;
  discountedPrice?: Price;
  quantity: number;
  variantOptions: Record<string, string>;
  subtotal: Price;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CartItem {
  private constructor(private readonly props: CartItemProps) {}

  public static create(
    productId: ProductId,
    productName: string,
    productImageUrl: string,
    storeId: StoreId,
    price: Price,
    quantity: number,
    variantOptions: Record<string, string> = {},
    discountedPrice?: Price
  ): CartItem {
    const now = new Date();
    const currentPrice = discountedPrice || price;
    const subtotal = Price.create(currentPrice.amount * quantity, currentPrice.currency);

    return new CartItem({
      id: `${productId.value}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      productImageUrl,
      storeId,
      price,
      discountedPrice,
      quantity,
      variantOptions,
      subtotal,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get productId(): ProductId {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get productImageUrl(): string {
    return this.props.productImageUrl;
  }

  get storeId(): StoreId {
    return this.props.storeId;
  }

  get price(): Price {
    return this.props.price;
  }

  get discountedPrice(): Price | undefined {
    return this.props.discountedPrice;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get variantOptions(): Record<string, string> {
    return { ...this.props.variantOptions };
  }

  get subtotal(): Price {
    return this.props.subtotal;
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    this.props.quantity = quantity;
    this.recalculateSubtotal();
    this.props.updatedAt = new Date();
  }

  public updatePrice(price: Price, discountedPrice?: Price): void {
    this.props.price = price;
    this.props.discountedPrice = discountedPrice;
    this.recalculateSubtotal();
    this.props.updatedAt = new Date();
  }

  public updateAvailability(isAvailable: boolean): void {
    this.props.isAvailable = isAvailable;
    this.props.updatedAt = new Date();
  }

  public updateProductInfo(name: string, imageUrl: string): void {
    this.props.productName = name;
    this.props.productImageUrl = imageUrl;
    this.props.updatedAt = new Date();
  }

  public updateVariantOptions(variantOptions: Record<string, string>): void {
    this.props.variantOptions = { ...variantOptions };
    this.props.updatedAt = new Date();
  }

  private recalculateSubtotal(): void {
    const currentPrice = this.props.discountedPrice || this.props.price;
    this.props.subtotal = Price.create(
      currentPrice.amount * this.props.quantity,
      currentPrice.currency
    );
  }

  public getCurrentPrice(): Price {
    return this.props.discountedPrice || this.props.price;
  }

  public hasDiscount(): boolean {
    return this.props.discountedPrice !== undefined;
  }

  public getDiscountPercentage(): number {
    if (!this.props.discountedPrice) {
      return 0;
    }
    return Math.round(((this.props.price.amount - this.props.discountedPrice.amount) / this.props.price.amount) * 100);
  }

  public getTotalSavings(): Price {
    if (!this.props.discountedPrice) {
      return Price.create(0, this.props.price.currency);
    }
    const savingsPerItem = this.props.price.amount - this.props.discountedPrice.amount;
    return Price.create(savingsPerItem * this.props.quantity, this.props.price.currency);
  }

  public hasVariants(): boolean {
    return Object.keys(this.props.variantOptions).length > 0;
  }

  public getVariantDisplay(): string {
    if (!this.hasVariants()) {
      return '';
    }
    return Object.entries(this.props.variantOptions)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  public isValid(): boolean {
    return this.props.isAvailable && this.props.quantity > 0;
  }

  public isSameProduct(productId: ProductId, variantOptions?: Record<string, string>): boolean {
    const sameProduct = this.props.productId.equals(productId);
    if (!variantOptions) {
      return sameProduct;
    }
    return sameProduct && JSON.stringify(this.props.variantOptions) === JSON.stringify(variantOptions);
  }

  public canCombineWith(other: CartItem): boolean {
    return this.isSameProduct(other.productId, other.variantOptions) &&
           this.props.storeId.equals(other.storeId);
  }

  public combineWith(other: CartItem): void {
    if (!this.canCombineWith(other)) {
      throw new Error('Cannot combine different cart items');
    }
    this.updateQuantity(this.props.quantity + other.quantity);
  }

  public toSnapshot(): CartItemProps {
    return {
      ...this.props,
      variantOptions: { ...this.props.variantOptions },
    };
  }
}