import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantOptions?: any,
    note?: string,
  ) {
    // Get product with store info
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { Store: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Check stock
    if (product.stock < quantity) {
      throw new ConflictException('Insufficient stock');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { CartItem: { include: { Product: true } } },
    });

    // Check if cart has items from different store (single-store policy)
    if (cart && cart.CartItem.length > 0) {
      const firstItem = cart.CartItem[0];
      if (firstItem.Product.storeId !== product.storeId) {
        throw new ConflictException('CART/DIFFERENT_STORE');
      }
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          id: uuidv4(),
          userId,
          storeId: product.storeId,
          updatedAt: new Date(),
        },
        include: { CartItem: { include: { Product: true } } },
      });
    }

    // Check if product already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          price: product.discountedPrice || product.price,
          variantOptions: variantOptions || existingItem.variantOptions,
          note,
          updatedAt: new Date(),
        },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          id: uuidv4(),
          cartId: cart.id,
          productId,
          quantity,
          price: product.discountedPrice || product.price,
          variantOptions: variantOptions || null,
          note,
          updatedAt: new Date(),
        },
      });
    }

    return this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    quantity: number,
    note?: string,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        Cart: true,
        Product: true,
      },
    });

    if (!item || item.Cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.Product.stock < quantity) {
      throw new ConflictException('Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        note,
        updatedAt: new Date(),
      },
    });

    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { Cart: true },
    });

    if (!item || item.Cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Store: {
                  select: { id: true, name: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
      };
    }

    const items = cart.CartItem.map((item) => ({
      id: item.id,
      product: {
        id: item.Product.id,
        name: item.Product.name,
        imageUrl: item.Product.imageUrl,
        price: item.Product.price,
        discountedPrice: item.Product.discountedPrice,
        store: item.Product.Store,
      },
      quantity: item.quantity,
      variantOptions: item.variantOptions,
      note: item.note,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = cart.discountAmount || 0;
    const deliveryFee = 0; // Will be calculated at checkout
    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal - discount + deliveryFee + tax;

    return {
      items,
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      itemCount: items.length,
    };
  }

  async applyDiscount(userId: string, discountCode: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const discount = await this.prisma.discountCode.findUnique({
      where: { code: discountCode },
    });

    if (!discount || !discount.isActive) {
      throw new NotFoundException('Invalid or expired discount code');
    }

    // Check if discount is expired
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      throw new ConflictException('Discount code has expired');
    }

    // Calculate discount amount
    const cartData = await this.getCart(userId);
    let discountAmount = 0;

    if (discount.type === 'PERCENTAGE') {
      discountAmount = (cartData.subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    // Update cart with discount
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountCodeId: discount.id,
        discountAmount,
        updatedAt: new Date(),
      },
    });

    return this.getCart(userId);
  }

  async removeDiscount(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        discountCodeId: null,
        discountAmount: 0,
        updatedAt: new Date(),
      },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await this.prisma.cart.delete({
        where: { id: cart.id },
      });
    }

    return { success: true, message: 'Cart cleared' };
  }

  async replaceStore(userId: string, newStoreId: string) {
    await this.clearCart(userId);

    await this.prisma.cart.create({
      data: {
        id: uuidv4(),
        userId,
        storeId: newStoreId,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: 'Cart replaced with new store' };
  }
}
