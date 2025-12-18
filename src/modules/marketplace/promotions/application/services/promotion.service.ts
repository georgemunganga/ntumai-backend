import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  // Promotions
  async getPromotions(categoryId?: string) {
    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((promo) => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      startDate: promo.startDate,
      endDate: promo.endDate,
    }));
  }

  async checkPromotionEligibility(userId: string, promoCode: string) {
    const discount = await this.prisma.discountCode.findUnique({
      where: { code: promoCode },
    });

    if (!discount) {
      return {
        eligible: false,
        reason: 'Promo code not found',
      };
    }

    if (!discount.isActive) {
      return {
        eligible: false,
        reason: 'Promo code is inactive',
      };
    }

    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return {
        eligible: false,
        reason: 'Promo code has expired',
      };
    }

    return {
      eligible: true,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        expiresAt: discount.expiresAt,
      },
    };
  }

  // Gift Cards
  async createGiftCard(
    senderUserId: string,
    amount: number,
    recipientEmail?: string,
    recipientPhone?: string,
    message?: string,
    designId?: string,
  ) {
    if (!recipientEmail && !recipientPhone) {
      throw new BadRequestException(
        'Either email or phone is required for recipient',
      );
    }

    // Generate unique code
    const code = `GIFT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Check if recipient exists
    let recipientUserId: string | undefined;
    if (recipientEmail) {
      const recipient = await this.prisma.user.findUnique({
        where: { email: recipientEmail },
      });
      recipientUserId = recipient?.id;
    } else if (recipientPhone) {
      const recipient = await this.prisma.user.findUnique({
        where: { phone: recipientPhone },
      });
      recipientUserId = recipient?.id;
    }

    const giftCard = await this.prisma.giftCard.create({
      data: {
        code,
        amount,
        balance: amount,
        senderUserId,
        recipientUserId,
        recipientEmail,
        recipientPhone,
        message,
        designId,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    // TODO: Send gift card via email/SMS through Communication module

    return {
      id: giftCard.id,
      code: giftCard.code,
      amount: giftCard.amount,
      recipientEmail: giftCard.recipientEmail,
      recipientPhone: giftCard.recipientPhone,
      expiresAt: giftCard.expiresAt,
    };
  }

  async getGiftCardDesigns() {
    // Mock gift card designs (in production, these would be in database)
    return [
      {
        id: 'design-1',
        name: 'Birthday',
        imageUrl: 'https://cdn.example.com/giftcards/birthday.jpg',
      },
      {
        id: 'design-2',
        name: 'Thank You',
        imageUrl: 'https://cdn.example.com/giftcards/thankyou.jpg',
      },
      {
        id: 'design-3',
        name: 'Congratulations',
        imageUrl: 'https://cdn.example.com/giftcards/congrats.jpg',
      },
      {
        id: 'design-4',
        name: 'Holiday',
        imageUrl: 'https://cdn.example.com/giftcards/holiday.jpg',
      },
    ];
  }

  async getGiftCardHistory(userId: string) {
    const [sent, received] = await Promise.all([
      this.prisma.giftCard.findMany({
        where: { senderUserId: userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.giftCard.findMany({
        where: {
          OR: [
            { recipientUserId: userId },
            { recipientEmail: { in: await this.getUserEmails(userId) } },
            { recipientPhone: { in: await this.getUserPhones(userId) } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      sent: sent.map((gc) => ({
        id: gc.id,
        code: gc.code,
        amount: gc.amount,
        balance: gc.balance,
        recipientEmail: gc.recipientEmail,
        recipientPhone: gc.recipientPhone,
        isRedeemed: gc.isRedeemed,
        createdAt: gc.createdAt,
      })),
      received: received.map((gc) => ({
        id: gc.id,
        code: gc.code,
        amount: gc.amount,
        balance: gc.balance,
        isRedeemed: gc.isRedeemed,
        redeemedAt: gc.redeemedAt,
        expiresAt: gc.expiresAt,
        createdAt: gc.createdAt,
      })),
    };
  }

  async redeemGiftCard(userId: string, code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (giftCard.isRedeemed) {
      throw new BadRequestException('Gift card already redeemed');
    }

    if (new Date() > giftCard.expiresAt) {
      throw new BadRequestException('Gift card has expired');
    }

    if (giftCard.balance <= 0) {
      throw new BadRequestException('Gift card has no balance');
    }

    // Mark as redeemed and assign to user
    const updated = await this.prisma.giftCard.update({
      where: { code },
      data: {
        recipientUserId: userId,
        isRedeemed: true,
        redeemedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // TODO: Add balance to user wallet/account

    return {
      success: true,
      amount: updated.amount,
      balance: updated.balance,
      message: `Gift card redeemed successfully. ${updated.amount} added to your account.`,
    };
  }

  // Helper methods
  private async getUserEmails(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ? [user.email] : [];
  }

  private async getUserPhones(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    return user?.phone ? [user.phone] : [];
  }
}
