import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartRepositoryImpl implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Cart | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: this.getCartInclude(),
    });

    return cart ? this.toDomain(cart) : null;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const cart = await this.prisma.cart.findFirst({
      where: { 
        userId,
        status: 'ACTIVE'
      },
      include: this.getCartInclude(),
    });

    return cart ? this.toDomain(cart) : null;
  }

  async findActiveByUserId(userId: string): Promise<Cart | null> {
    const cart = await this.prisma.cart.findFirst({
      where: { 
        userId,
        status: 'ACTIVE'
      },
      include: this.getCartInclude(),
    });

    return cart ? this.toDomain(cart) : null;
  }

  async findAbandonedCarts(olderThanHours: number): Promise<Cart[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const carts = await this.prisma.cart.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: {
          lt: cutoffDate
        }
      },
      include: this.getCartInclude(),
    });

    return carts.map(cart => this.toDomain(cart));
  }

  async save(cart: Cart): Promise<Cart> {
    const cartData = this.toPersistence(cart);
    
    if (cart.getId()) {
      // Update existing cart
      const updatedCart = await this.prisma.cart.update({
        where: { id: cart.getId() },
        data: {
          status: cartData.status,
          totalAmount: cartData.totalAmount,
          itemCount: cartData.itemCount,
          updatedAt: new Date(),
        },
        include: this.getCartInclude(),
      });
      return this.toDomain(updatedCart);
    } else {
      // Create new cart
      const createdCart = await this.prisma.cart.create({
        data: cartData,
        include: this.getCartInclude(),
      });
      return this.toDomain(createdCart);
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cart.delete({
      where: { id },
    });
  }

  async addItem(cartId: string, item: CartItem): Promise<void> {
    const itemData = this.cartItemToPersistence(item, cartId);
    
    // Check if item already exists
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: itemData.productId,
        variantId: itemData.variantId,
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + itemData.quantity,
          subtotal: existingItem.subtotal + itemData.subtotal,
        },
      });
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: itemData,
      });
    }

    // Update cart totals
    await this.updateCartTotals(cartId);
  }

  async updateItem(cartId: string, productId: string, quantity: number, variantId?: string): Promise<void> {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId,
      },
      include: {
        product: true,
      },
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: item.id },
      });
    } else {
      const subtotal = item.product.price * quantity;
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: {
          quantity,
          subtotal,
        },
      });
    }

    // Update cart totals
    await this.updateCartTotals(cartId);
  }

  async removeItem(cartId: string, productId: string, variantId?: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: {
        cartId,
        productId,
        variantId,
      },
    });

    // Update cart totals
    await this.updateCartTotals(cartId);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        totalAmount: 0,
        itemCount: 0,
        updatedAt: new Date(),
      },
    });
  }

  async mergeCarts(sourceCartId: string, targetCartId: string): Promise<void> {
    const sourceItems = await this.prisma.cartItem.findMany({
      where: { cartId: sourceCartId },
    });

    for (const item of sourceItems) {
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: targetCartId,
          productId: item.productId,
          variantId: item.variantId,
        },
      });

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + item.quantity,
            subtotal: existingItem.subtotal + item.subtotal,
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            ...item,
            id: undefined,
            cartId: targetCartId,
          },
        });
      }
    }

    // Delete source cart
    await this.delete(sourceCartId);

    // Update target cart totals
    await this.updateCartTotals(targetCartId);
  }

  private async updateCartTotals(cartId: string): Promise<void> {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        totalAmount,
        itemCount,
        updatedAt: new Date(),
      },
    });
  }

  private getCartInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              category: true,
              brand: true,
              store: true,
            },
          },
        },
      },
      user: true,
    };
  }

  private toDomain(cart: any): Cart {
    const items = cart.items?.map((item: any) => this.cartItemToDomain(item)) || [];
    
    return new Cart(
      cart.id,
      cart.userId,
      items,
      cart.status,
      new Price(cart.totalAmount, 'USD'),
      cart.itemCount,
      cart.createdAt,
      cart.updatedAt
    );
  }

  private cartItemToDomain(item: any): CartItem {
    return new CartItem(
      item.id,
      item.productId,
      item.product?.name || '',
      item.quantity,
      new Price(item.unitPrice, 'USD'),
      new Price(item.subtotal, 'USD'),
      item.variantId,
      item.product
    );
  }

  private toPersistence(cart: Cart): Prisma.CartCreateInput {
    return {
      id: cart.getId(),
      user: { connect: { id: cart.getUserId() } },
      status: cart.getStatus() as any,
      totalAmount: cart.getTotalAmount().getAmount(),
      itemCount: cart.getItemCount(),
      createdAt: cart.getCreatedAt(),
      updatedAt: cart.getUpdatedAt(),
    };
  }

  private cartItemToPersistence(item: CartItem, cartId: string): Prisma.CartItemCreateInput {
    return {
      id: item.getId(),
      cart: { connect: { id: cartId } },
      product: { connect: { id: item.getProductId() } },
      quantity: item.getQuantity(),
      unitPrice: item.getUnitPrice().getAmount(),
      subtotal: item.getSubtotal().getAmount(),
      variantId: item.getVariantId(),
    };
  }
}