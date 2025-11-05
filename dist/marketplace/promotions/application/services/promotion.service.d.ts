import { PrismaService } from '../../../../shared/database/prisma.service';
export declare class PromotionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPromotions(categoryId?: string): Promise<{
        id: string;
        title: string;
        description: string;
        type: import("@prisma/client").$Enums.PromotionType;
        value: number;
        startDate: Date;
        endDate: Date;
    }[]>;
    checkPromotionEligibility(userId: string, promoCode: string): Promise<{
        eligible: boolean;
        reason: string;
        discount?: undefined;
    } | {
        eligible: boolean;
        discount: {
            code: string;
            type: import("@prisma/client").$Enums.DiscountType;
            value: number;
            expiresAt: Date | null;
        };
        reason?: undefined;
    }>;
    createGiftCard(senderUserId: string, amount: number, recipientEmail?: string, recipientPhone?: string, message?: string, designId?: string): Promise<{
        id: string;
        code: string;
        amount: number;
        recipientEmail: string | null;
        recipientPhone: string | null;
        expiresAt: Date;
    }>;
    getGiftCardDesigns(): Promise<{
        id: string;
        name: string;
        imageUrl: string;
    }[]>;
    getGiftCardHistory(userId: string): Promise<{
        sent: {
            id: string;
            code: string;
            amount: number;
            balance: number;
            recipientEmail: string | null;
            recipientPhone: string | null;
            isRedeemed: boolean;
            createdAt: Date;
        }[];
        received: {
            id: string;
            code: string;
            amount: number;
            balance: number;
            isRedeemed: boolean;
            redeemedAt: Date | null;
            expiresAt: Date;
            createdAt: Date;
        }[];
    }>;
    redeemGiftCard(userId: string, code: string): Promise<{
        success: boolean;
        amount: number;
        balance: number;
        message: string;
    }>;
    private getUserEmails;
    private getUserPhones;
}
