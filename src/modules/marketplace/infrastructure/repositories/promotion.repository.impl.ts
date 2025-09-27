import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PromotionRepository } from '../../domain/repositories/promotion.repository';
import { Promotion } from '../../domain/entities/promotion.entity';
import { GiftCard } from '../../domain/entities/gift-card.entity';
import { Price } from '../../domain/value-objects/price.value-object';
import { Prisma } from '@prisma/client';

export interface PromotionSearchFilters {
  code?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface GiftCardSearchFilters {
  code?: string;
  status?: string;
  purchasedBy?: string;
  receivedBy?: string;
  isActive?: boolean;
}

export interface PromotionAnalytics {
  totalPromotions: number;
  activePromotions: number;
  totalUsage: number;
  totalDiscount: number;
  conversionRate: number;
  topPromotions: Array<{
    id: string;
    code: string;
    usageCount: number;
    totalDiscount: number;
  }>;
}

@Injectable()
export class PromotionRepositoryImpl implements PromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Promotion methods
  async findPromotionById(id: string): Promise<Promotion | null> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: this.getPromotionInclude(),
    });

    return promotion ? this.promotionToDomain(promotion) : null;
  }

  async findPromotionByCode(code: string): Promise<Promotion | null> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
      include: this.getPromotionInclude(),
    });

    return promotion ? this.promotionToDomain(promotion) : null;
  }

  async findActivePromotions(limit?: number, offset?: number): Promise<Promotion[]> {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      include: this.getPromotionInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return promotions.map(promotion => this.promotionToDomain(promotion));
  }

  async searchPromotions(filters: PromotionSearchFilters, limit?: number, offset?: number): Promise<Promotion[]> {
    const where: Prisma.PromotionWhereInput = {};

    if (filters.code) {
      where.code = {
        contains: filters.code,
        mode: 'insensitive',
      };
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.isActive !== undefined) {
      const now = new Date();
      if (filters.isActive) {
        where.AND = [
          { status: 'ACTIVE' },
          { validFrom: { lte: now } },
          { validTo: { gte: now } },
        ];
      } else {
        where.OR = [
          { status: { not: 'ACTIVE' } },
          { validFrom: { gt: now } },
          { validTo: { lt: now } },
        ];
      }
    }

    if (filters.validFrom) {
      where.validFrom = { gte: filters.validFrom };
    }

    if (filters.validTo) {
      where.validTo = { lte: filters.validTo };
    }

    const promotions = await this.prisma.promotion.findMany({
      where,
      include: this.getPromotionInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return promotions.map(promotion => this.promotionToDomain(promotion));
  }

  async savePromotion(promotion: Promotion): Promise<Promotion> {
    const promotionData = this.promotionToPersistence(promotion);
    
    if (promotion.getId()) {
      // Update existing promotion
      const updatedPromotion = await this.prisma.promotion.update({
        where: { id: promotion.getId() },
        data: {
          name: promotionData.name,
          description: promotionData.description,
          type: promotionData.type,
          value: promotionData.value,
          minimumOrderAmount: promotionData.minimumOrderAmount,
          maximumDiscount: promotionData.maximumDiscount,
          usageLimit: promotionData.usageLimit,
          usagePerUser: promotionData.usagePerUser,
          validFrom: promotionData.validFrom,
          validTo: promotionData.validTo,
          status: promotionData.status,
          updatedAt: new Date(),
        },
        include: this.getPromotionInclude(),
      });
      return this.promotionToDomain(updatedPromotion);
    } else {
      // Create new promotion
      const createdPromotion = await this.prisma.promotion.create({
        data: promotionData,
        include: this.getPromotionInclude(),
      });
      return this.promotionToDomain(createdPromotion);
    }
  }

  async deletePromotion(id: string): Promise<void> {
    await this.prisma.promotion.delete({
      where: { id },
    });
  }

  async validatePromotion(code: string, userId: string, orderAmount: number): Promise<boolean> {
    const now = new Date();
    const promotion = await this.prisma.promotion.findUnique({
      where: { code },
      include: {
        usage: {
          where: { userId },
        },
        _count: {
          select: { usage: true },
        },
      },
    });

    if (!promotion) return false;
    if (promotion.status !== 'ACTIVE') return false;
    if (promotion.validFrom > now || promotion.validTo < now) return false;
    if (promotion.minimumOrderAmount && orderAmount < promotion.minimumOrderAmount) return false;
    if (promotion.usageLimit && promotion._count.usage >= promotion.usageLimit) return false;
    if (promotion.usagePerUser && promotion.usage.length >= promotion.usagePerUser) return false;

    return true;
  }

  async recordPromotionUsage(promotionId: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
    await this.prisma.promotionUsage.create({
      data: {
        promotion: { connect: { id: promotionId } },
        user: { connect: { id: userId } },
        order: { connect: { id: orderId } },
        discountAmount,
      },
    });
  }

  async getPromotionAnalytics(filters: PromotionSearchFilters): Promise<PromotionAnalytics> {
    const where: Prisma.PromotionWhereInput = {};
    
    if (filters.validFrom || filters.validTo) {
      where.createdAt = {};
      if (filters.validFrom) where.createdAt.gte = filters.validFrom;
      if (filters.validTo) where.createdAt.lte = filters.validTo;
    }

    const [totalPromotions, activePromotions, usageStats, topPromotions] = await Promise.all([
      this.prisma.promotion.count({ where }),
      this.prisma.promotion.count({
        where: {
          ...where,
          status: 'ACTIVE',
        },
      }),
      this.prisma.promotionUsage.aggregate({
        where: {
          promotion: where,
        },
        _count: { id: true },
        _sum: { discountAmount: true },
      }),
      this.prisma.promotion.findMany({
        where,
        include: {
          _count: {
            select: { usage: true },
          },
          usage: {
            select: {
              discountAmount: true,
            },
          },
        },
        orderBy: {
          usage: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalPromotions,
      activePromotions,
      totalUsage: usageStats._count.id || 0,
      totalDiscount: usageStats._sum.discountAmount || 0,
      conversionRate: totalPromotions > 0 ? (usageStats._count.id || 0) / totalPromotions : 0,
      topPromotions: topPromotions.map(p => ({
        id: p.id,
        code: p.code,
        usageCount: p._count.usage,
        totalDiscount: p.usage.reduce((sum, u) => sum + u.discountAmount, 0),
      })),
    };
  }

  // Gift Card methods
  async findGiftCardById(id: string): Promise<GiftCard | null> {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { id },
      include: this.getGiftCardInclude(),
    });

    return giftCard ? this.giftCardToDomain(giftCard) : null;
  }

  async findGiftCardByCode(code: string): Promise<GiftCard | null> {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
      include: this.getGiftCardInclude(),
    });

    return giftCard ? this.giftCardToDomain(giftCard) : null;
  }

  async findGiftCardsByUser(userId: string, type: 'purchased' | 'received'): Promise<GiftCard[]> {
    const where = type === 'purchased' 
      ? { purchasedById: userId }
      : { receivedById: userId };

    const giftCards = await this.prisma.giftCard.findMany({
      where,
      include: this.getGiftCardInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return giftCards.map(giftCard => this.giftCardToDomain(giftCard));
  }

  async searchGiftCards(filters: GiftCardSearchFilters, limit?: number, offset?: number): Promise<GiftCard[]> {
    const where: Prisma.GiftCardWhereInput = {};

    if (filters.code) {
      where.code = {
        contains: filters.code,
        mode: 'insensitive',
      };
    }

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.purchasedBy) {
      where.purchasedById = filters.purchasedBy;
    }

    if (filters.receivedBy) {
      where.receivedById = filters.receivedBy;
    }

    if (filters.isActive !== undefined) {
      const now = new Date();
      if (filters.isActive) {
        where.AND = [
          { status: 'ACTIVE' },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          { balance: { gt: 0 } },
        ];
      }
    }

    const giftCards = await this.prisma.giftCard.findMany({
      where,
      include: this.getGiftCardInclude(),
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return giftCards.map(giftCard => this.giftCardToDomain(giftCard));
  }

  async saveGiftCard(giftCard: GiftCard): Promise<GiftCard> {
    const giftCardData = this.giftCardToPersistence(giftCard);
    
    if (giftCard.getId()) {
      // Update existing gift card
      const updatedGiftCard = await this.prisma.giftCard.update({
        where: { id: giftCard.getId() },
        data: {
          balance: giftCardData.balance,
          status: giftCardData.status,
          expiresAt: giftCardData.expiresAt,
          updatedAt: new Date(),
        },
        include: this.getGiftCardInclude(),
      });
      return this.giftCardToDomain(updatedGiftCard);
    } else {
      // Create new gift card
      const createdGiftCard = await this.prisma.giftCard.create({
        data: giftCardData,
        include: this.getGiftCardInclude(),
      });
      return this.giftCardToDomain(createdGiftCard);
    }
  }

  async deleteGiftCard(id: string): Promise<void> {
    await this.prisma.giftCard.delete({
      where: { id },
    });
  }

  async validateGiftCard(code: string, amount: number): Promise<boolean> {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) return false;
    if (giftCard.status !== 'ACTIVE') return false;
    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) return false;
    if (giftCard.balance < amount) return false;

    return true;
  }

  async useGiftCard(code: string, amount: number, orderId: string): Promise<void> {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      throw new Error('Gift card not found');
    }

    const newBalance = giftCard.balance - amount;
    
    await this.prisma.giftCard.update({
      where: { id: giftCard.id },
      data: {
        balance: newBalance,
        updatedAt: new Date(),
      },
    });

    // Record the transaction
    await this.prisma.giftCardTransaction.create({
      data: {
        giftCard: { connect: { id: giftCard.id } },
        order: { connect: { id: orderId } },
        amount: -amount,
        type: 'REDEMPTION',
        description: `Used for order ${orderId}`,
      },
    });
  }

  private getPromotionInclude() {
    return {
      usage: {
        include: {
          user: true,
          order: true,
        },
      },
      _count: {
        select: {
          usage: true,
        },
      },
    };
  }

  private getGiftCardInclude() {
    return {
      purchasedBy: true,
      receivedBy: true,
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    };
  }

  private promotionToDomain(promotion: any): Promotion {
    return new Promotion(
      promotion.id,
      promotion.code,
      promotion.name,
      promotion.description,
      promotion.type,
      promotion.value,
      promotion.minimumOrderAmount,
      promotion.maximumDiscount,
      promotion.usageLimit,
      promotion.usagePerUser,
      promotion.validFrom,
      promotion.validTo,
      promotion.status,
      promotion.createdAt,
      promotion.updatedAt,
      promotion._count?.usage || 0
    );
  }

  private giftCardToDomain(giftCard: any): GiftCard {
    return new GiftCard(
      giftCard.id,
      giftCard.code,
      new Price(giftCard.initialAmount, 'USD'),
      new Price(giftCard.balance, 'USD'),
      giftCard.purchasedById,
      giftCard.receivedById,
      giftCard.message,
      giftCard.status,
      giftCard.expiresAt,
      giftCard.createdAt,
      giftCard.updatedAt
    );
  }

  private promotionToPersistence(promotion: Promotion): Prisma.PromotionCreateInput {
    return {
      id: promotion.getId(),
      code: promotion.getCode(),
      name: promotion.getName(),
      description: promotion.getDescription(),
      type: promotion.getType() as any,
      value: promotion.getValue(),
      minimumOrderAmount: promotion.getMinimumOrderAmount(),
      maximumDiscount: promotion.getMaximumDiscount(),
      usageLimit: promotion.getUsageLimit(),
      usagePerUser: promotion.getUsagePerUser(),
      validFrom: promotion.getValidFrom(),
      validTo: promotion.getValidTo(),
      status: promotion.getStatus() as any,
      createdAt: promotion.getCreatedAt(),
      updatedAt: promotion.getUpdatedAt(),
    };
  }

  private giftCardToPersistence(giftCard: GiftCard): Prisma.GiftCardCreateInput {
    const data: Prisma.GiftCardCreateInput = {
      id: giftCard.getId(),
      code: giftCard.getCode(),
      initialAmount: giftCard.getInitialAmount().getAmount(),
      balance: giftCard.getBalance().getAmount(),
      message: giftCard.getMessage(),
      status: giftCard.getStatus() as any,
      expiresAt: giftCard.getExpiresAt(),
      createdAt: giftCard.getCreatedAt(),
      updatedAt: giftCard.getUpdatedAt(),
    };

    if (giftCard.getPurchasedById()) {
      data.purchasedBy = { connect: { id: giftCard.getPurchasedById() } };
    }

    if (giftCard.getReceivedById()) {
      data.receivedBy = { connect: { id: giftCard.getReceivedById() } };
    }

    return data;
  }
}