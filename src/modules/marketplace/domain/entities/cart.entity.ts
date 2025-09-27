import { AggregateRoot } from '@nestjs/cqrs';
import { CartId } from '../value-objects/cart-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { StoreId } from '../value-objects/store-id.vo';
import { CartItem } from './cart-item.entity';
import { Price } from '../value-objects/price.vo';
import { DiscountCode } from '../value-objects/discount-code.vo';
import { CartCreatedEvent } from '../events/cart-created.event';
import { CartItemAddedEvent } from '../events/cart-item-added.event';
import { CartItemUpdatedEvent } from '../events/cart-item-updated.event';
import { CartItemRemovedEvent } from '../events/cart-item-removed.event';
import { CartClearedEvent } from '../events/cart-cleared.event';
import { DiscountAppliedEvent } from '../events/discount-applied.event';

export interface CartProps {
  id: CartId;
  userId: UserId;
  storeId?: StoreId;
  items: CartItem[];
  appliedDiscount?: DiscountCode;
  subtotal: Price;
  discountAmount: Price;
  deliveryFee: Price;
  tax: Price;
  total: Price;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Cart extends AggregateRoot {
  private constructor(private readonly props: CartProps) {
    super();
  }

  public static create(userId: UserId): Cart {
    const cartId = CartId.generate();
    const now = new Date();
    const zeroPrice = Price.create(0, 'USD');
    
    const cart = new Cart({
      id: cartId,
      userId,
      items: [],
      subtotal: zeroPrice,
      discountAmount: zeroPrice,
      deliveryFee: zeroPrice,
      tax: zeroPrice,
      total: zeroPrice,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    cart.apply(new CartCreatedEvent(cartId.value, userId.value));
    return cart;
  }

  public static fromPersistence(props: CartProps): Cart {
    return new Cart(props);
  }

  // Getters
  get id(): CartId {
    return this.props.id;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get storeId(): StoreId | undefined {
    return this.props.storeId;
  }

  get items(): CartItem[] {
    return [...this.props.items];
  }

  get appliedDiscount(): DiscountCode | undefined {
    return this.props.appliedDiscount;
  }

  get subtotal(): Price {
    return this.props.subtotal;
  }

  get discountAmount(): Price {
    return this.props.discountAmount;
  }

  get deliveryFee(): Price {
    return this.props.deliveryFee;
  }

  get tax(): Price {
    return this.props.tax;
  }

  get total(): Price {
    return this.props.total;
  }

  get itemCount(): number {
    return this.props.itemCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public addItem(item: CartItem): void {
    // Check if cart is empty or from same store
    if (this.props.items.length > 0 && this.props.storeId && !this.props.storeId.equals(item.storeId)) {
      throw new Error('Cannot add items from different stores to the same cart');
    }

    // Check if item already exists
    const existingItemIndex = this.props.items.findIndex(cartItem => 
      cartItem.productId.equals(item.productId) && 
      JSON.stringify(cartItem.variantOptions) === JSON.stringify(item.variantOptions)
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const existingItem = this.props.items[existingItemIndex];
      const newQuantity = existingItem.quantity + item.quantity;
      existingItem.updateQuantity(newQuantity);
    } else {
      // Add new item
      this.props.items.push(item);
      if (!this.props.storeId) {
        this.props.storeId = item.storeId;
      }
    }

    this.recalculateTotals();
    this.apply(new CartItemAddedEvent(this.props.id.value, item.productId.value, item.quantity));
  }

  public updateItemQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const item = this.props.items.find(item => item.id === itemId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.updateQuantity(quantity);
    this.recalculateTotals();
    this.apply(new CartItemUpdatedEvent(this.props.id.value, itemId, quantity));
  }

  public removeItem(itemId: string): void {
    const itemIndex = this.props.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    const removedItem = this.props.items.splice(itemIndex, 1)[0];
    
    // If cart is empty, clear store association
    if (this.props.items.length === 0) {
      this.props.storeId = undefined;
      this.removeDiscount(); // Clear discount when cart is empty
    }

    this.recalculateTotals();
    this.apply(new CartItemRemovedEvent(this.props.id.value, itemId, removedItem.productId.value));
  }

  public clearCart(): void {
    this.props.items = [];
    this.props.storeId = undefined;
    this.removeDiscount();
    this.recalculateTotals();
    this.apply(new CartClearedEvent(this.props.id.value));
  }

  public applyDiscount(discountCode: DiscountCode): void {
    this.props.appliedDiscount = discountCode;
    this.recalculateTotals();
    this.apply(new DiscountAppliedEvent(this.props.id.value, discountCode.code, discountCode.amount));
  }

  public removeDiscount(): void {
    this.props.appliedDiscount = undefined;
    this.recalculateTotals();
  }

  public updateDeliveryFee(deliveryFee: Price): void {
    this.props.deliveryFee = deliveryFee;
    this.recalculateTotals();
  }

  public updateTax(tax: Price): void {
    this.props.tax = tax;
    this.recalculateTotals();
  }

  private recalculateTotals(): void {
    // Calculate subtotal
    const subtotalAmount = this.props.items.reduce((sum, item) => sum + item.subtotal.amount, 0);
    this.props.subtotal = Price.create(subtotalAmount, 'USD');

    // Calculate discount amount
    let discountAmount = 0;
    if (this.props.appliedDiscount) {
      if (this.props.appliedDiscount.type === 'percentage') {
        discountAmount = (subtotalAmount * this.props.appliedDiscount.amount) / 100;
      } else {
        discountAmount = Math.min(this.props.appliedDiscount.amount, subtotalAmount);
      }
    }
    this.props.discountAmount = Price.create(discountAmount, 'USD');

    // Calculate total
    const totalAmount = subtotalAmount - discountAmount + this.props.deliveryFee.amount + this.props.tax.amount;
    this.props.total = Price.create(Math.max(0, totalAmount), 'USD');

    // Update item count
    this.props.itemCount = this.props.items.reduce((sum, item) => sum + item.quantity, 0);

    this.props.updatedAt = new Date();
  }

  public isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  public hasItems(): boolean {
    return this.props.items.length > 0;
  }

  public getItemById(itemId: string): CartItem | undefined {
    return this.props.items.find(item => item.id === itemId);
  }

  public hasItemFromProduct(productId: string, variantOptions?: Record<string, string>): boolean {
    return this.props.items.some(item => 
      item.productId.value === productId && 
      (!variantOptions || JSON.stringify(item.variantOptions) === JSON.stringify(variantOptions))
    );
  }

  public canCheckout(): boolean {
    return this.hasItems() && this.props.total.amount > 0;
  }

  public validateForCheckout(): void {
    if (this.isEmpty()) {
      throw new Error('Cannot checkout with empty cart');
    }

    if (this.props.total.amount <= 0) {
      throw new Error('Cart total must be greater than 0');
    }

    // Validate all items are still available
    for (const item of this.props.items) {
      if (!item.isValid()) {
        throw new Error(`Item ${item.productName} is no longer available`);
      }
    }
  }

  public toSnapshot(): CartProps {
    return {
      ...this.props,
      items: [...this.props.items],
    };
  }
}