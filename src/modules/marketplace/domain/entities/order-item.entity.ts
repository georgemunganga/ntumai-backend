import { ProductId } from '../value-objects/product-id.vo';
import { Price } from '../value-objects/price.vo';

export interface OrderItemProps {
  id: string;
  productId: ProductId;
  productName: string;
  productImageUrl: string;
  price: Price;
  discountedPrice?: Price;
  quantity: number;
  variantOptions: Record<string, string>;
  subtotal: Price;
  notes?: string;
  createdAt: Date;
}

export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  public static create(
    productId: ProductId,
    productName: string,
    productImageUrl: string,
    price: Price,
    quantity: number,
    variantOptions: Record<string, string> = {},
    discountedPrice?: Price,
    notes?: string
  ): OrderItem {
    if (quantity <= 0) {
      throw new Error('Order item quantity must be greater than 0');
    }

    const currentPrice = discountedPrice || price;
    const subtotal = Price.create(currentPrice.amount * quantity, currentPrice.currency);

    return new OrderItem({
      id: `${productId.value}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      productImageUrl,
      price,
      discountedPrice,
      quantity,
      variantOptions,
      subtotal,
      notes,
      createdAt: new Date(),
    });
  }

  public static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
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

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
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

  public hasNotes(): boolean {
    return this.props.notes !== undefined && this.props.notes.trim().length > 0;
  }

  public getDisplayName(): string {
    let displayName = this.props.productName;
    const variantDisplay = this.getVariantDisplay();
    if (variantDisplay) {
      displayName += ` (${variantDisplay})`;
    }
    return displayName;
  }

  public getTotalPrice(): Price {
    return this.props.subtotal;
  }

  public getUnitPrice(): Price {
    return this.getCurrentPrice();
  }

  public isSameProduct(productId: ProductId, variantOptions?: Record<string, string>): boolean {
    const sameProduct = this.props.productId.equals(productId);
    if (!variantOptions) {
      return sameProduct;
    }
    return sameProduct && JSON.stringify(this.props.variantOptions) === JSON.stringify(variantOptions);
  }

  public toSnapshot(): OrderItemProps {
    return {
      ...this.props,
      variantOptions: { ...this.props.variantOptions },
    };
  }
}