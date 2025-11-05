"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/database/prisma.service");
let PromotionService = class PromotionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPromotions(categoryId) {
        const where = {
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
    async checkPromotionEligibility(userId, promoCode) {
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
    async createGiftCard(senderUserId, amount, recipientEmail, recipientPhone, message, designId) {
        if (!recipientEmail && !recipientPhone) {
            throw new common_1.BadRequestException('Either email or phone is required for recipient');
        }
        const code = `GIFT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        let recipientUserId;
        if (recipientEmail) {
            const recipient = await this.prisma.user.findUnique({
                where: { email: recipientEmail },
            });
            recipientUserId = recipient?.id;
        }
        else if (recipientPhone) {
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
    async getGiftCardHistory(userId) {
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
    async redeemGiftCard(userId, code) {
        const giftCard = await this.prisma.giftCard.findUnique({
            where: { code },
        });
        if (!giftCard) {
            throw new common_1.NotFoundException('Gift card not found');
        }
        if (giftCard.isRedeemed) {
            throw new common_1.BadRequestException('Gift card already redeemed');
        }
        if (new Date() > giftCard.expiresAt) {
            throw new common_1.BadRequestException('Gift card has expired');
        }
        if (giftCard.balance <= 0) {
            throw new common_1.BadRequestException('Gift card has no balance');
        }
        const updated = await this.prisma.giftCard.update({
            where: { code },
            data: {
                recipientUserId: userId,
                isRedeemed: true,
                redeemedAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return {
            success: true,
            amount: updated.amount,
            balance: updated.balance,
            message: `Gift card redeemed successfully. ${updated.amount} added to your account.`,
        };
    }
    async getUserEmails(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        return user?.email ? [user.email] : [];
    }
    async getUserPhones(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { phone: true },
        });
        return user?.phone ? [user.phone] : [];
    }
};
exports.PromotionService = PromotionService;
exports.PromotionService = PromotionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionService);
//# sourceMappingURL=promotion.service.js.map