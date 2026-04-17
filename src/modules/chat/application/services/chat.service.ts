import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryService } from '../../../deliveries/application/services/delivery.service';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ChatGateway } from '../../infrastructure/websocket/chat.gateway';
import {
  ChatContextTypeDto,
  ConversationDto,
  ConversationMessageDto,
  GetOrCreateConversationDto,
  SendConversationMessageDto,
} from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: DeliveryService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getOrCreateConversation(
    userId: string,
    role: string | undefined,
    input: GetOrCreateConversationDto,
  ) {
    const normalizedContextType = this.toSchemaContextType(input.contextType);
    const participants = await this.resolveContextParticipants(
      userId,
      normalizedContextType,
      input.contextId,
    );

    const conversationModel = (this.prisma as any).conversation;
    const participantModel = (this.prisma as any).conversationParticipant;

    let conversation = await conversationModel.findUnique({
      where: {
        contextType_contextId: {
          contextType: normalizedContextType,
          contextId: input.contextId,
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
    });

    if (!conversation) {
      conversation = await conversationModel.create({
        data: {
          contextType: normalizedContextType,
          contextId: input.contextId,
          status: 'active',
        },
        include: {
          participants: true,
          messages: true,
        },
      });
    }

    for (const participant of participants) {
      await participantModel.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: participant.userId,
          },
        },
        update: {
          role: participant.role ?? undefined,
        },
        create: {
          conversationId: conversation.id,
          userId: participant.userId,
          role: participant.role ?? undefined,
        },
      });
    }

    const refreshedConversation = await conversationModel.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
    });

    return {
      success: true,
      data: {
        conversation: this.toConversationDto(refreshedConversation),
      },
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.requireConversationParticipant(
      userId,
      conversationId,
    );

    return {
      success: true,
      data: {
        conversation: this.toConversationDto(conversation),
      },
    };
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.requireConversationParticipant(
      userId,
      conversationId,
    );

    const messages = await (this.prisma as any).conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });

    return {
      success: true,
      data: {
        conversation: this.toConversationDto(conversation),
        messages: messages.map((message: any) => this.toMessageDto(message)),
      },
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendConversationMessageDto,
  ) {
    await this.requireConversationParticipant(userId, conversationId);

    const message = await (this.prisma as any).conversationMessage.create({
      data: {
        conversationId,
        senderId: userId,
        body: input.body.trim(),
        messageType: input.messageType?.trim() || 'text',
      },
      include: { sender: true },
    });

    await (this.prisma as any).conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
      },
    });

    const messageDto = this.toMessageDto(message);
    this.chatGateway.emitMessageCreated(conversationId, messageDto);

    return {
      success: true,
      data: {
        message: messageDto,
      },
    };
  }

  async markConversationRead(userId: string, conversationId: string) {
    await this.requireConversationParticipant(userId, conversationId);

    const readAt = new Date();
    await (this.prisma as any).conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: readAt },
    });

    this.chatGateway.emitConversationRead(
      conversationId,
      userId,
      readAt.toISOString(),
    );

    return {
      success: true,
      data: {
        success: true,
        readAt: readAt.toISOString(),
      },
    };
  }

  async findExistingConversationId(
    contextType: ChatContextTypeDto,
    contextId: string,
  ): Promise<string | null> {
    const conversation = await (this.prisma as any).conversation.findUnique({
      where: {
        contextType_contextId: {
          contextType: this.toSchemaContextType(contextType),
          contextId,
        },
      },
      select: { id: true },
    });

    return conversation?.id ?? null;
  }

  private async requireConversationParticipant(userId: string, conversationId: string) {
    const conversation = await (this.prisma as any).conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const participant = conversation.participants.find(
      (item: any) => item.userId === userId,
    );

    if (!participant) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return conversation;
  }

  private async resolveContextParticipants(
    userId: string,
    contextType: 'MARKETPLACE_ORDER' | 'DELIVERY' | 'BOOKING' | 'SUPPORT_TICKET',
    contextId: string,
  ) {
    switch (contextType) {
      case 'MARKETPLACE_ORDER': {
        const order = await this.prisma.order.findUnique({
          where: { id: contextId },
          include: {
            User: true,
            OrderItem: {
              include: {
                Product: {
                  include: {
                    Store: true,
                  },
                },
              },
            },
          },
        });

        if (!order) {
          throw new NotFoundException('Marketplace order not found');
        }

        const vendorIds = Array.from(
          new Set(
            order.OrderItem.map((item) => item.Product?.Store?.vendorId).filter(
              Boolean,
            ),
          ),
        ) as string[];

        const participantIds = new Set<string>([order.userId, ...vendorIds]);
        if (!participantIds.has(userId)) {
          throw new ForbiddenException(
            'You do not have access to this order conversation',
          );
        }

        return [
          { userId: order.userId, role: 'CUSTOMER' },
          ...vendorIds.map((vendorId) => ({ userId: vendorId, role: 'VENDOR' })),
        ];
      }

      case 'DELIVERY': {
        const delivery = await this.deliveryService.getDeliveryById(contextId);
        const metadata = this.parseJson(delivery.more_info);
        const linkedMarketplaceOrderId = metadata?.marketplace_order_id
          ? String(metadata.marketplace_order_id)
          : null;

        const vendorIds = linkedMarketplaceOrderId
          ? await this.getMarketplaceOrderVendorIds(linkedMarketplaceOrderId)
          : [];

        const participantIds = new Set<string>(
          [delivery.created_by_user_id, delivery.rider_id, ...vendorIds].filter(
            Boolean,
          ) as string[],
        );

        if (!participantIds.has(userId)) {
          throw new ForbiddenException(
            'You do not have access to this delivery conversation',
          );
        }

        return [
          delivery.created_by_user_id
            ? {
                userId: delivery.created_by_user_id,
                role: String(delivery.placed_by_role || 'CUSTOMER').toUpperCase(),
              }
            : null,
          ...vendorIds.map((vendorId) => ({
            userId: vendorId,
            role: 'VENDOR',
          })),
          delivery.rider_id
            ? {
                userId: delivery.rider_id,
                role: 'DRIVER',
              }
            : null,
        ].filter(Boolean) as Array<{ userId: string; role: string }>;
      }

      case 'SUPPORT_TICKET': {
        const ticket = await (this.prisma as any).supportTicket.findUnique({
          where: { id: contextId },
        });

        if (!ticket) {
          throw new NotFoundException('Support ticket not found');
        }

        if (ticket.userId !== userId) {
          throw new ForbiddenException(
            'You do not have access to this support conversation',
          );
        }

        return [{ userId: ticket.userId, role: 'CUSTOMER' }];
      }

      default:
        throw new NotFoundException('This chat context is not available yet');
    }
  }

  private toSchemaContextType(contextType: ChatContextTypeDto) {
    switch (contextType) {
      case ChatContextTypeDto.MARKETPLACE_ORDER:
        return 'MARKETPLACE_ORDER' as const;
      case ChatContextTypeDto.DELIVERY:
        return 'DELIVERY' as const;
      case ChatContextTypeDto.BOOKING:
        return 'BOOKING' as const;
      case ChatContextTypeDto.SUPPORT_TICKET:
        return 'SUPPORT_TICKET' as const;
    }
  }

  private parseJson(value?: string | null): Record<string, unknown> | null {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private async getMarketplaceOrderVendorIds(orderId: string): Promise<string[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: {
          include: {
            Product: {
              include: {
                Store: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return [];
    }

    return Array.from(
      new Set(
        order.OrderItem.map((item) => item.Product?.Store?.vendorId).filter(
          Boolean,
        ),
      ),
    ) as string[];
  }

  private toDtoContextType(contextType: string): ChatContextTypeDto {
    switch (contextType) {
      case 'DELIVERY':
        return ChatContextTypeDto.DELIVERY;
      case 'BOOKING':
        return ChatContextTypeDto.BOOKING;
      case 'SUPPORT_TICKET':
        return ChatContextTypeDto.SUPPORT_TICKET;
      default:
        return ChatContextTypeDto.MARKETPLACE_ORDER;
    }
  }

  private toConversationDto(conversation: any): ConversationDto {
    return {
      id: conversation.id,
      contextType: this.toDtoContextType(conversation.contextType),
      contextId: conversation.contextId,
      status: conversation.status,
      participants: (conversation.participants || []).map((participant: any) => ({
        userId: participant.userId,
        role: participant.role ?? null,
        firstName: participant.user?.firstName ?? null,
        lastName: participant.user?.lastName ?? null,
        profileImage: participant.user?.profileImage ?? null,
        lastReadAt: participant.lastReadAt
          ? participant.lastReadAt.toISOString()
          : null,
      })),
      lastMessage: conversation.messages?.[0]
        ? this.toMessageDto(conversation.messages[0])
        : null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  private toMessageDto(message: any): ConversationMessageDto {
    const senderName = [message.sender?.firstName, message.sender?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: senderName || null,
      body: message.body,
      messageType: message.messageType,
      metadata: message.metadata ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
