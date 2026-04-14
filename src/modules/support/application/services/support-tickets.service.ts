import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import {
  CreateSupportTicketDto,
  SupportTicketCategoryDto,
  SupportTicketStatusDto,
} from '../dtos/support-ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const supportTicket = (this.prisma as any).supportTicket;
    const tickets = await supportTicket.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      success: true,
      data: {
        tickets: tickets.map((ticket) => this.toPayload(ticket)),
      },
    };
  }

  async create(userId: string, input: CreateSupportTicketDto) {
    const supportTicket = (this.prisma as any).supportTicket;
    const created = await supportTicket.create({
      data: {
        userId,
        category: input.category ? this.toCategory(input.category) : 'GENERAL',
        subject: input.subject.trim(),
        description: input.description.trim(),
        status: 'OPEN',
      },
    });

    return {
      success: true,
      data: {
        ticket: this.toPayload(created),
        tickets: (
          await supportTicket.findMany({
            where: { userId },
            orderBy: [{ createdAt: 'desc' }],
          })
        ).map((ticket) => this.toPayload(ticket)),
      },
    };
  }

  async getOne(userId: string, ticketId: string) {
    const supportTicket = (this.prisma as any).supportTicket;
    const ticket = await supportTicket.findFirst({
      where: { id: ticketId, userId },
    });

    if (!ticket) {
      throw new BadRequestException('Support ticket not found');
    }

    return {
      success: true,
      data: {
        ticket: this.toPayload(ticket),
      },
    };
  }

  private toCategory(value: SupportTicketCategoryDto): string {
    switch (value) {
      case SupportTicketCategoryDto.ACCOUNT:
        return 'ACCOUNT';
      case SupportTicketCategoryDto.ORDER:
        return 'ORDER';
      case SupportTicketCategoryDto.PAYMENT:
        return 'PAYMENT';
      case SupportTicketCategoryDto.DELIVERY:
        return 'DELIVERY';
      case SupportTicketCategoryDto.ONBOARDING:
        return 'ONBOARDING';
      case SupportTicketCategoryDto.TECHNICAL:
        return 'TECHNICAL';
      default:
        return 'GENERAL';
    }
  }

  private toCategoryDto(value: string): SupportTicketCategoryDto {
    switch (value) {
      case 'ACCOUNT':
        return SupportTicketCategoryDto.ACCOUNT;
      case 'ORDER':
        return SupportTicketCategoryDto.ORDER;
      case 'PAYMENT':
        return SupportTicketCategoryDto.PAYMENT;
      case 'DELIVERY':
        return SupportTicketCategoryDto.DELIVERY;
      case 'ONBOARDING':
        return SupportTicketCategoryDto.ONBOARDING;
      case 'TECHNICAL':
        return SupportTicketCategoryDto.TECHNICAL;
      default:
        return SupportTicketCategoryDto.GENERAL;
    }
  }

  private toStatusDto(value: string): SupportTicketStatusDto {
    switch (value) {
      case 'IN_PROGRESS':
        return SupportTicketStatusDto.IN_PROGRESS;
      case 'RESOLVED':
        return SupportTicketStatusDto.RESOLVED;
      case 'CLOSED':
        return SupportTicketStatusDto.CLOSED;
      default:
        return SupportTicketStatusDto.OPEN;
    }
  }

  private toPayload(ticket: {
    id: string;
    category: string;
    status: string;
    subject: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: ticket.id,
      category: this.toCategoryDto(ticket.category),
      status: this.toStatusDto(ticket.status),
      subject: ticket.subject,
      description: ticket.description,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }
}
