import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CustomerPaymentMethodType,
  MobileMoneyProvider,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import {
  CustomerPaymentMethodTypeDto,
  MobileMoneyProviderDto,
  UpdatePaymentMethodDto,
  UpsertPaymentMethodDto,
} from '../dtos/payment-methods.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const methods = await this.prisma.customerPaymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      success: true,
      data: {
        methods: methods.map((method) => this.toPayload(method)),
      },
    };
  }

  async create(userId: string, input: UpsertPaymentMethodDto) {
    this.validateInput(input.type, input);

    const existingCount = await this.prisma.customerPaymentMethod.count({
      where: { userId, isActive: true },
    });
    const shouldSetDefault = Boolean(input.isDefault) || existingCount === 0;

    if (shouldSetDefault) {
      await this.clearDefault(userId);
    }

    const created = await this.prisma.customerPaymentMethod.create({
      data: {
        userId,
        type: this.toType(input.type),
        provider: input.provider ? this.toProvider(input.provider) : null,
        label: this.resolveLabel(input.type, input),
        cardBrand: input.type === CustomerPaymentMethodTypeDto.CARD
          ? this.detectCardBrand(input.cardNumber!)
          : null,
        last4: input.type === CustomerPaymentMethodTypeDto.CARD
          ? this.extractLast4(input.cardNumber!)
          : null,
        expiryMonth: input.type === CustomerPaymentMethodTypeDto.CARD ? input.expiryMonth ?? null : null,
        expiryYear: input.type === CustomerPaymentMethodTypeDto.CARD ? input.expiryYear ?? null : null,
        cardholderName: input.type === CustomerPaymentMethodTypeDto.CARD
          ? input.cardholderName?.trim() || null
          : null,
        phoneNumber: input.type === CustomerPaymentMethodTypeDto.MOBILE_MONEY
          ? input.phoneNumber?.trim() || null
          : null,
        accountName: input.type === CustomerPaymentMethodTypeDto.MOBILE_MONEY
          ? input.accountName?.trim() || null
          : null,
        isDefault: shouldSetDefault,
      },
    });

    return {
      success: true,
      data: {
        method: this.toPayload(created),
        methods: (await this.getMethods(userId)).map((method) => this.toPayload(method)),
      },
    };
  }

  async update(
    userId: string,
    methodId: string,
    input: UpdatePaymentMethodDto,
  ) {
    const existing = await this.prisma.customerPaymentMethod.findFirst({
      where: { id: methodId, userId, isActive: true },
    });

    if (!existing) {
      throw new BadRequestException('Payment method not found');
    }

    this.validateInput(
      existing.type === CustomerPaymentMethodType.CARD
        ? CustomerPaymentMethodTypeDto.CARD
        : CustomerPaymentMethodTypeDto.MOBILE_MONEY,
      { ...existing, ...input } as any,
      true,
    );

    if (input.isDefault) {
      await this.clearDefault(userId);
    }

    const cardNumber = input.cardNumber?.trim();
    const updated = await this.prisma.customerPaymentMethod.update({
      where: { id: methodId },
      data: {
        label: input.label !== undefined ? input.label.trim() : undefined,
        provider:
          existing.type === CustomerPaymentMethodType.MOBILE_MONEY && input.provider
            ? this.toProvider(input.provider)
            : undefined,
        cardBrand:
          existing.type === CustomerPaymentMethodType.CARD && cardNumber
            ? this.detectCardBrand(cardNumber)
            : undefined,
        last4:
          existing.type === CustomerPaymentMethodType.CARD && cardNumber
            ? this.extractLast4(cardNumber)
            : undefined,
        expiryMonth:
          existing.type === CustomerPaymentMethodType.CARD
            ? input.expiryMonth ?? undefined
            : undefined,
        expiryYear:
          existing.type === CustomerPaymentMethodType.CARD
            ? input.expiryYear ?? undefined
            : undefined,
        cardholderName:
          existing.type === CustomerPaymentMethodType.CARD && input.cardholderName !== undefined
            ? input.cardholderName.trim()
            : undefined,
        phoneNumber:
          existing.type === CustomerPaymentMethodType.MOBILE_MONEY && input.phoneNumber !== undefined
            ? input.phoneNumber.trim()
            : undefined,
        accountName:
          existing.type === CustomerPaymentMethodType.MOBILE_MONEY && input.accountName !== undefined
            ? input.accountName.trim()
            : undefined,
        isDefault: input.isDefault ?? undefined,
      },
    });

    return {
      success: true,
      data: {
        method: this.toPayload(updated),
        methods: (await this.getMethods(userId)).map((method) => this.toPayload(method)),
      },
    };
  }

  async setDefault(userId: string, methodId: string) {
    const existing = await this.prisma.customerPaymentMethod.findFirst({
      where: { id: methodId, userId, isActive: true },
      select: { id: true },
    });

    if (!existing) {
      throw new BadRequestException('Payment method not found');
    }

    await this.prisma.$transaction([
      this.prisma.customerPaymentMethod.updateMany({
        where: { userId, isActive: true, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.customerPaymentMethod.update({
        where: { id: methodId },
        data: { isDefault: true },
      }),
    ]);

    return this.list(userId);
  }

  async remove(userId: string, methodId: string) {
    const existing = await this.prisma.customerPaymentMethod.findFirst({
      where: { id: methodId, userId, isActive: true },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      throw new BadRequestException('Payment method not found');
    }

    await this.prisma.customerPaymentMethod.delete({
      where: { id: methodId },
    });

    if (existing.isDefault) {
      const fallback = await this.prisma.customerPaymentMethod.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (fallback) {
        await this.prisma.customerPaymentMethod.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        });
      }
    }

    return this.list(userId);
  }

  private async getMethods(userId: string) {
    return this.prisma.customerPaymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  private async clearDefault(userId: string) {
    await this.prisma.customerPaymentMethod.updateMany({
      where: { userId, isActive: true, isDefault: true },
      data: { isDefault: false },
    });
  }

  private validateInput(
    type: CustomerPaymentMethodTypeDto,
    input: Partial<UpsertPaymentMethodDto>,
    isUpdate = false,
  ) {
    if (type === CustomerPaymentMethodTypeDto.CARD) {
      if (!isUpdate && !input.cardNumber) {
        throw new BadRequestException('Card number is required');
      }
      if (
        !isUpdate &&
        (input.expiryMonth === undefined || input.expiryYear === undefined)
      ) {
        throw new BadRequestException('Card expiry date is required');
      }
      if (!isUpdate && !input.cardholderName?.trim()) {
        throw new BadRequestException('Cardholder name is required');
      }
      return;
    }

    if (!input.provider) {
      throw new BadRequestException('Mobile money provider is required');
    }
    if (!input.phoneNumber?.trim()) {
      throw new BadRequestException('Mobile money phone number is required');
    }
    if (!input.accountName?.trim()) {
      throw new BadRequestException('Account name is required');
    }
  }

  private toType(type: CustomerPaymentMethodTypeDto): CustomerPaymentMethodType {
    return type === CustomerPaymentMethodTypeDto.CARD
      ? CustomerPaymentMethodType.CARD
      : CustomerPaymentMethodType.MOBILE_MONEY;
  }

  private toProvider(provider: MobileMoneyProviderDto): MobileMoneyProvider {
    switch (provider) {
      case MobileMoneyProviderDto.MTN:
        return MobileMoneyProvider.MTN;
      case MobileMoneyProviderDto.AIRTEL:
        return MobileMoneyProvider.AIRTEL;
      case MobileMoneyProviderDto.ZAMTEL:
        return MobileMoneyProvider.ZAMTEL;
    }
  }

  private resolveLabel(
    type: CustomerPaymentMethodTypeDto,
    input: Partial<UpsertPaymentMethodDto>,
  ) {
    if (input.label?.trim()) {
      return input.label.trim();
    }

    if (type === CustomerPaymentMethodTypeDto.CARD) {
      return `${this.detectCardBrand(input.cardNumber!)} card`;
    }

    return `${input.provider} mobile money`;
  }

  private detectCardBrand(cardNumber: string) {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.startsWith('4')) return 'visa';
    if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
    if (digits.startsWith('3')) return 'amex';
    return 'card';
  }

  private extractLast4(cardNumber: string) {
    const digits = cardNumber.replace(/\D/g, '');
    return digits.slice(-4);
  }

  private toPayload(method: any) {
    return {
      id: method.id,
      type:
        method.type === CustomerPaymentMethodType.CARD
          ? CustomerPaymentMethodTypeDto.CARD
          : CustomerPaymentMethodTypeDto.MOBILE_MONEY,
      provider: method.provider?.toLowerCase(),
      label: method.label,
      cardBrand: method.cardBrand || undefined,
      last4: method.last4 || undefined,
      expiryMonth: method.expiryMonth || undefined,
      expiryYear: method.expiryYear || undefined,
      cardholderName: method.cardholderName || undefined,
      phoneNumber: method.phoneNumber || undefined,
      accountName: method.accountName || undefined,
      isDefault: Boolean(method.isDefault),
      createdAt: method.createdAt.toISOString(),
      updatedAt: method.updatedAt.toISOString(),
    };
  }
}
