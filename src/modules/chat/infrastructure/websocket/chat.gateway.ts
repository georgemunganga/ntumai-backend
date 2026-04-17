import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat: ${client.id}`);
  }

  @SubscribeMessage('subscribe:conversation')
  async handleSubscribeConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const participant = await (this.prisma as any).conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
    });

    if (!participant) {
      return {
        success: false,
        message: 'You do not have access to this conversation',
      };
    }

    client.join(this.roomName(data.conversationId));
    client.data.userId = data.userId;
    client.data.conversationId = data.conversationId;

    this.logger.log(
      `Client ${client.id} subscribed to conversation ${data.conversationId}`,
    );

    return {
      success: true,
      message: `Subscribed to conversation ${data.conversationId}`,
    };
  }

  @SubscribeMessage('unsubscribe:conversation')
  handleUnsubscribeConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(this.roomName(data.conversationId));

    this.logger.log(
      `Client ${client.id} unsubscribed from conversation ${data.conversationId}`,
    );

    return {
      success: true,
      message: `Unsubscribed from conversation ${data.conversationId}`,
    };
  }

  @SubscribeMessage('conversation:typing')
  async handleTyping(
    @MessageBody()
    data: { conversationId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const participant = await (this.prisma as any).conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: data.userId,
        },
      },
    });

    if (!participant) {
      return {
        success: false,
        message: 'You do not have access to this conversation',
      };
    }

    client.to(this.roomName(data.conversationId)).emit('conversation:typing', {
      conversationId: data.conversationId,
      userId: data.userId,
      isTyping: Boolean(data.isTyping),
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  emitMessageCreated(conversationId: string, message: any) {
    this.server.to(this.roomName(conversationId)).emit('conversation:message', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  emitConversationRead(
    conversationId: string,
    userId: string,
    readAt: string,
  ) {
    this.server.to(this.roomName(conversationId)).emit('conversation:read', {
      conversationId,
      userId,
      readAt,
      timestamp: new Date().toISOString(),
    });
  }

  private roomName(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}
