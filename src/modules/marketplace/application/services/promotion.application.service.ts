import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PromotionRepository } from '../../domain/repositories/promotion.repository';
import { GiftCardRepository } from '../../domain/repositories/gift-card.repository';
import { UserRepository } from '../../../user/domain/repositories/user.repository';
import { Promotion } from '../../domain/entities/promotion.entity';
import { GiftCard } from '../../domain/entities/gift-card.entity';
import { PromotionService } from '../../domain/services/promotion.service';
import { PromotionDetails } from '../../domain/value-objects/promotion-details.value-object';

export interface CreatePromotionData {
  title: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageLimitPerUser?: number;
  applicableTo: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'BRAND' | 'USER_TIER';
  applicableIds?: string[];
  code?: string;
  isActive?: boolean;
  stackable?: boolean;
  firstTimeUserOnly?: boolean;
  minimumPurchaseHistory?: number;
}

export interface UpdatePromotionData {
  title?: string;
  description?: string;
  value?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageLimitPerUser?: number;
  isActive?: boolean;
  stackable?: boolean;
}

export interface PromotionSearchFilters {
  type?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED';
  applicableTo?: string;
  code?: string;
  title?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created' | 'title' | 'value' | 'usage' | 'expiry';
  sortOrder?: 'asc' | 'desc';
}

export interface PromotionSearchResult {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PromotionValidationResult {
  isValid: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  errors: string[];
  warnings: string[];
}

export interface PromotionUsageStats {
  promotionId: string;
  totalUsage: number;
  uniqueUsers: number;
  totalDiscountGiven: number;
  averageOrderValue: number;
  conversionRate: number;
  usageByDate: Array<{ date: Date; usage: number; discount: number }>;
  topUsers: Array<{ userId: string; usageCount: number; totalDiscount: number }>;
}

export interface CreateGiftCardData {
  code?: string;
  amount: number;
  currency: string;
  purchasedByUserId?: string;
  recipientUserId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  expiryDate?: Date;
  isActive?: boolean;
}

export interface GiftCardSearchFilters {
  status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  purchasedByUserId?: string;
  recipientUserId?: string;
  code?: string;
  amountFrom?: number;
  amountTo?: number;
  dateFrom?: Date;
  dateTo?: Date;
  expiryFrom?: Date;
  expiryTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'created' | 'amount' | 'expiry' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

export interface GiftCardSearchResult {
  giftCards: GiftCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GiftCardValidationResult {
  isValid: boolean;
  giftCard?: GiftCard;
  availableAmount?: number;
  errors: string[];
}

export interface GiftCardUsage {
  giftCardId: string;
  orderId: string;
  amount: number;
  usedAt: Date;
  remainingBalance: number;
}

export interface PromotionAnalytics {
  totalPromotions: number;
  activePromotions: number;
  totalUsage: number;
  totalDiscountGiven: number;
  averageDiscountPerOrder: number;
  promotionsByType: Record<string, number>;
  topPerformingPromotions: Array<{
    promotionId: string;
    title: string;
    usage: number;
    discountGiven: number;
    conversionRate: number;
  }>;
  usageTrends: Array<{ date: Date; usage: number; discount: number }>;
}

export interface GiftCardAnalytics {
  totalGiftCards: number;
  activeGiftCards: number;
  totalValue: number;
  usedValue: number;
  remainingValue: number;
  averageGiftCardValue: number;
  redemptionRate: number;
  giftCardsByStatus: Record<string, number>;
  salesTrends: Array<{ date: Date; sold: number; value: number }>;
  usageTrends: Array<{ date: Date; used: number; value: number }>;
}

@Injectable()
export class PromotionApplicationService {
  constructor(
    private readonly promotionRepository: PromotionRepository,
    private readonly giftCardRepository: GiftCardRepository,
    private readonly userRepository: UserRepository,
    private readonly promotionService: PromotionService,
  ) {}

  // Promotion Management
  async createPromotion(data: CreatePromotionData): Promise<Promotion> {
    // Validate promotion data
    if (data.endDate <= data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (data.value <= 0) {
      throw new BadRequestException('Promotion value must be positive');
    }

    // Check for duplicate promotion code if provided
    if (data.code) {
      const existingPromotion = await this.promotionRepository.findByCode(data.code);
      if (existingPromotion) {
        throw new ConflictException('Promotion code already exists');
      }
    }

    // Create promotion details
    const promotionDetails = new PromotionDetails(
      data.title,
      data.description,
      data.type,
      data.value,
      data.minimumOrderAmount,
      data.maximumDiscountAmount,
      data.stackable || false,
      data.firstTimeUserOnly || false,
      data.minimumPurchaseHistory || 0,
    );

    // Create promotion entity
    const promotion = Promotion.create(
      promotionDetails,
      data.startDate,
      data.endDate,
      data.usageLimit,
      data.usageLimitPerUser,
      data.applicableTo,
      data.applicableIds || [],
      data.code,
      data.isActive !== false,
    );

    return await this.promotionRepository.create(promotion);
  }

  async updatePromotion(id: string, data: UpdatePromotionData): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Validate update data
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (data.value !== undefined && data.value <= 0) {
      throw new BadRequestException('Promotion value must be positive');
    }

    // Update promotion
    if (data.title) promotion.updateTitle(data.title);
    if (data.description) promotion.updateDescription(data.description);
    if (data.value !== undefined) promotion.updateValue(data.value);
    if (data.minimumOrderAmount !== undefined) promotion.updateMinimumOrderAmount(data.minimumOrderAmount);
    if (data.maximumDiscountAmount !== undefined) promotion.updateMaximumDiscountAmount(data.maximumDiscountAmount);
    if (data.startDate) promotion.updateStartDate(data.startDate);
    if (data.endDate) promotion.updateEndDate(data.endDate);
    if (data.usageLimit !== undefined) promotion.updateUsageLimit(data.usageLimit);
    if (data.usageLimitPerUser !== undefined) promotion.updateUsageLimitPerUser(data.usageLimitPerUser);
    if (data.isActive !== undefined) {
      if (data.isActive) {
        promotion.activate();
      } else {
        promotion.deactivate();
      }
    }
    if (data.stackable !== undefined) promotion.updateStackable(data.stackable);

    return await this.promotionRepository.update(promotion);
  }

  async deletePromotion(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Check if promotion has been used
    const usageCount = await this.promotionRepository.getUsageCount(id);
    if (usageCount > 0) {
      throw new BadRequestException('Cannot delete promotion that has been used');
    }

    await this.promotionRepository.delete(id);
  }

  async getPromotionById(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  async getPromotionByCode(code: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findByCode(code);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  // Promotion Search and Filtering
  async searchPromotions(filters: PromotionSearchFilters): Promise<PromotionSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { promotions, total } = await this.promotionRepository.findWithFilters({
      ...filters,
      offset,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      promotions,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getActivePromotions(): Promise<Promotion[]> {
    return await this.promotionRepository.findActive();
  }

  async getApplicablePromotions(data: {
    userId?: string;
    productIds?: string[];
    categoryIds?: string[];
    brandIds?: string[];
    orderAmount?: number;
  }): Promise<Promotion[]> {
    const activePromotions = await this.getActivePromotions();
    const applicablePromotions: Promotion[] = [];

    for (const promotion of activePromotions) {
      const isApplicable = await this.promotionService.isPromotionApplicable(
        promotion,
        data.userId,
        data.productIds || [],
        data.categoryIds || [],
        data.brandIds || [],
        data.orderAmount || 0,
      );

      if (isApplicable) {
        applicablePromotions.push(promotion);
      }
    }

    return applicablePromotions;
  }

  // Promotion Validation and Application
  async validatePromotion(code: string, data: {
    userId?: string;
    productIds?: string[];
    categoryIds?: string[];
    brandIds?: string[];
    orderAmount: number;
  }): Promise<PromotionValidationResult> {
    try {
      const promotion = await this.getPromotionByCode(code);
      
      const validationResult = await this.promotionService.validatePromotion(
        promotion,
        data.userId,
        data.productIds || [],
        data.categoryIds || [],
        data.brandIds || [],
        data.orderAmount,
      );

      if (!validationResult.isValid) {
        return {
          isValid: false,
          errors: validationResult.errors,
          warnings: [],
        };
      }

      const discountAmount = await this.promotionService.calculateDiscount(
        promotion,
        data.orderAmount,
        data.productIds || [],
      );

      return {
        isValid: true,
        promotion,
        discountAmount,
        errors: [],
        warnings: validationResult.warnings || [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  async applyPromotion(promotionId: string, orderId: string, userId?: string): Promise<{
    success: boolean;
    discountAmount: number;
    usageId: string;
  }> {
    const promotion = await this.getPromotionById(promotionId);
    
    const result = await this.promotionService.applyPromotion(
      promotion,
      orderId,
      userId,
    );

    if (result.success) {
      // Update promotion usage
      await this.promotionRepository.incrementUsage(promotionId);
      
      // Record usage history
      await this.promotionRepository.recordUsage({
        promotionId,
        orderId,
        userId,
        discountAmount: result.discountAmount,
        usedAt: new Date(),
      });
    }

    return result;
  }

  // Promotion Analytics
  async getPromotionUsageStats(promotionId: string): Promise<PromotionUsageStats> {
    return await this.promotionRepository.getUsageStats(promotionId);
  }

  async getPromotionAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PromotionAnalytics> {
    return await this.promotionRepository.getAnalytics(filters);
  }

  // Gift Card Management
  async createGiftCard(data: CreateGiftCardData): Promise<GiftCard> {
    // Validate gift card data
    if (data.amount <= 0) {
      throw new BadRequestException('Gift card amount must be positive');
    }

    // Check for duplicate gift card code if provided
    if (data.code) {
      const existingGiftCard = await this.giftCardRepository.findByCode(data.code);
      if (existingGiftCard) {
        throw new ConflictException('Gift card code already exists');
      }
    }

    // Validate recipient
    if (data.recipientUserId) {
      const recipient = await this.userRepository.findById(data.recipientUserId);
      if (!recipient) {
        throw new NotFoundException('Recipient user not found');
      }
    }

    // Create gift card
    const giftCard = GiftCard.create(
      data.amount,
      data.currency,
      data.purchasedByUserId,
      data.recipientUserId,
      data.recipientEmail,
      data.recipientPhone,
      data.message,
      data.expiryDate,
      data.code,
      data.isActive !== false,
    );

    const savedGiftCard = await this.giftCardRepository.create(giftCard);

    // Send gift card notification if recipient is specified
    if (data.recipientUserId || data.recipientEmail) {
      this.sendGiftCardNotification(savedGiftCard).catch(error => {
        console.error('Failed to send gift card notification:', error);
      });
    }

    return savedGiftCard;
  }

  async getGiftCardById(id: string): Promise<GiftCard> {
    const giftCard = await this.giftCardRepository.findById(id);
    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }
    return giftCard;
  }

  async getGiftCardByCode(code: string): Promise<GiftCard> {
    const giftCard = await this.giftCardRepository.findByCode(code);
    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }
    return giftCard;
  }

  // Gift Card Search and Filtering
  async searchGiftCards(filters: GiftCardSearchFilters): Promise<GiftCardSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { giftCards, total } = await this.giftCardRepository.findWithFilters({
      ...filters,
      offset,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      giftCards,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getUserGiftCards(userId: string, includeUsed: boolean = false): Promise<GiftCard[]> {
    return await this.giftCardRepository.findByUserId(userId, includeUsed);
  }

  // Gift Card Validation and Usage
  async validateGiftCard(code: string, amount?: number): Promise<GiftCardValidationResult> {
    try {
      const giftCard = await this.getGiftCardByCode(code);
      
      if (!giftCard.isActive()) {
        return {
          isValid: false,
          errors: ['Gift card is not active'],
        };
      }

      if (giftCard.isExpired()) {
        return {
          isValid: false,
          errors: ['Gift card has expired'],
        };
      }

      if (giftCard.isFullyUsed()) {
        return {
          isValid: false,
          errors: ['Gift card has been fully used'],
        };
      }

      const availableAmount = giftCard.getRemainingBalance();
      
      if (amount && amount > availableAmount) {
        return {
          isValid: false,
          errors: [`Insufficient gift card balance. Available: ${availableAmount}`],
        };
      }

      return {
        isValid: true,
        giftCard,
        availableAmount,
        errors: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
      };
    }
  }

  async useGiftCard(code: string, amount: number, orderId: string): Promise<GiftCardUsage> {
    const validationResult = await this.validateGiftCard(code, amount);
    
    if (!validationResult.isValid) {
      throw new BadRequestException(`Gift card validation failed: ${validationResult.errors.join(', ')}`);
    }

    const giftCard = validationResult.giftCard!;
    
    // Use gift card
    giftCard.use(amount, orderId);
    
    // Save updated gift card
    await this.giftCardRepository.update(giftCard);
    
    // Record usage
    const usage: GiftCardUsage = {
      giftCardId: giftCard.getId(),
      orderId,
      amount,
      usedAt: new Date(),
      remainingBalance: giftCard.getRemainingBalance(),
    };

    await this.giftCardRepository.recordUsage(usage);

    return usage;
  }

  async cancelGiftCard(id: string, reason: string): Promise<GiftCard> {
    const giftCard = await this.getGiftCardById(id);
    
    if (giftCard.getUsedAmount() > 0) {
      throw new BadRequestException('Cannot cancel gift card that has been partially used');
    }

    giftCard.cancel(reason);
    return await this.giftCardRepository.update(giftCard);
  }

  // Gift Card Analytics
  async getGiftCardAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<GiftCardAnalytics> {
    return await this.giftCardRepository.getAnalytics(filters);
  }

  async getGiftCardUsageHistory(giftCardId: string): Promise<GiftCardUsage[]> {
    return await this.giftCardRepository.getUsageHistory(giftCardId);
  }

  // Bulk Operations
  async bulkCreateGiftCards(giftCards: CreateGiftCardData[]): Promise<GiftCard[]> {
    const createdGiftCards: GiftCard[] = [];
    
    for (const giftCardData of giftCards) {
      try {
        const giftCard = await this.createGiftCard(giftCardData);
        createdGiftCards.push(giftCard);
      } catch (error) {
        console.error(`Failed to create gift card:`, error);
      }
    }

    return createdGiftCards;
  }

  async bulkActivatePromotions(promotionIds: string[]): Promise<Promotion[]> {
    const promotions = await this.promotionRepository.findByIds(promotionIds);
    const activatedPromotions: Promotion[] = [];

    for (const promotion of promotions) {
      try {
        promotion.activate();
        const updatedPromotion = await this.promotionRepository.update(promotion);
        activatedPromotions.push(updatedPromotion);
      } catch (error) {
        console.error(`Failed to activate promotion ${promotion.getId()}:`, error);
      }
    }

    return activatedPromotions;
  }

  async bulkDeactivatePromotions(promotionIds: string[]): Promise<Promotion[]> {
    const promotions = await this.promotionRepository.findByIds(promotionIds);
    const deactivatedPromotions: Promotion[] = [];

    for (const promotion of promotions) {
      try {
        promotion.deactivate();
        const updatedPromotion = await this.promotionRepository.update(promotion);
        deactivatedPromotions.push(updatedPromotion);
      } catch (error) {
        console.error(`Failed to deactivate promotion ${promotion.getId()}:`, error);
      }
    }

    return deactivatedPromotions;
  }

  // Helper Methods
  private async sendGiftCardNotification(giftCard: GiftCard): Promise<void> {
    // This would typically send notifications via:
    // - Email
    // - SMS
    // - Push notification
    console.log(`Gift card notification sent for gift card ${giftCard.getCode()}`);
  }

  // Promotion Status Management
  async activatePromotion(id: string): Promise<Promotion> {
    const promotion = await this.getPromotionById(id);
    promotion.activate();
    return await this.promotionRepository.update(promotion);
  }

  async deactivatePromotion(id: string): Promise<Promotion> {
    const promotion = await this.getPromotionById(id);
    promotion.deactivate();
    return await this.promotionRepository.update(promotion);
  }

  async getExpiredPromotions(): Promise<Promotion[]> {
    return await this.promotionRepository.findExpired();
  }

  async getExpiringPromotions(days: number = 7): Promise<Promotion[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return await this.promotionRepository.findExpiringBefore(expiryDate);
  }
}