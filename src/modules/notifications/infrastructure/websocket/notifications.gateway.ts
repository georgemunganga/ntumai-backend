import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token) as {
        userId?: string;
        sub?: string;
      };
      const userId = payload.userId || payload.sub;

      if (!userId) {
        throw new UnauthorizedException('Invalid token');
      }

      client.data.userId = userId;
      client.join(this.roomName(userId));

      this.logger.log(`Client ${client.id} subscribed to notifications for ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Notification socket rejected for ${client.id}: ${error instanceof Error ? error.message : error}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from notifications: ${client.id}`);
  }

  emitNotificationCreated(userId: string, notification: any, unreadCount: number) {
    this.server.to(this.roomName(userId)).emit('notification:new', {
      notification,
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  }

  private roomName(userId: string) {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header !== 'string') {
      return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
