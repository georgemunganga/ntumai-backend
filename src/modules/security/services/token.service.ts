import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { ITokenService, TokenPayload, TokenOptions } from '../interfaces/security.interface';
import * as crypto from 'crypto';

@Injectable()
export class TokenService implements ITokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly defaultAccessTokenExpiry: string;
  private readonly defaultRefreshTokenExpiry: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    this.defaultAccessTokenExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m');
    this.defaultRefreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
  }

  async generateAccessToken(
    payload: TokenPayload,
    options?: TokenOptions,
  ): Promise<string> {
    try {
      const tokenOptions = {
        expiresIn: options?.expiresIn || this.defaultAccessTokenExpiry,
        issuer: options?.issuer || 'ntumai-api',
        audience: options?.audience || 'ntumai-client',
      };

      const token = this.jwtService.sign(
        {
          sub: payload.userId,
          email: payload.email,
          phoneNumber: payload.phoneNumber,
          roles: payload.roles,
          sessionId: payload.sessionId,
          type: 'access',
        },
        {
          secret: this.jwtSecret,
          ...tokenOptions,
        },
      );

      this.logger.log(`Access token generated for user ${payload.userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to generate access token for user ${payload.userId}`, error);
      throw new Error('Access token generation failed');
    }
  }

  async generateRefreshToken(
    payload: TokenPayload,
    options?: TokenOptions,
  ): Promise<string> {
    try {
      const tokenOptions = {
        expiresIn: options?.expiresIn || this.defaultRefreshTokenExpiry,
        issuer: options?.issuer || 'ntumai-api',
        audience: options?.audience || 'ntumai-client',
      };

      const token = this.jwtService.sign(
        {
          sub: payload.userId,
          type: 'refresh',
        },
        {
          secret: this.refreshTokenSecret,
          ...tokenOptions,
        },
      );

      // Store refresh token session
      const expiresAt = new Date();
      if (typeof tokenOptions.expiresIn === 'string') {
        const match = tokenOptions.expiresIn.match(/(\d+)([smhd])/);
        if (match) {
          const [, amount, unit] = match;
          const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] || 86400000;
          expiresAt.setTime(expiresAt.getTime() + parseInt(amount) * multiplier);
        }
      } else {
        expiresAt.setTime(expiresAt.getTime() + (tokenOptions.expiresIn as number) * 1000);
      }

      await this.prisma.refreshToken.create({
        data: {
          userId: payload.userId,
          token: await this.hashToken(token),
          expiresAt,
        },
      });

      this.logger.log(`Refresh token generated for user ${payload.userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Failed to generate refresh token for user ${payload.userId}`, error);
      throw new Error('Refresh token generation failed');
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.jwtSecret,
      });

      return {
        userId: decoded.sub,
        email: decoded.email,
        phoneNumber: decoded.phoneNumber,
        roles: decoded.roles || [],
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new Error('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in database
      const hashedToken = await this.hashToken(refreshToken);

      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          userId: decoded.sub,
          token: hashedToken,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              userRoles: {
                where: { isActive: true },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!tokenRecord) {
        throw new Error('Refresh token not found or expired');
      }

      // Generate new tokens
      const payload: TokenPayload = {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email || undefined,
        phoneNumber: tokenRecord.user.phone || undefined,
        roles: tokenRecord.user.userRoles?.map(userRole => userRole.role) || [],
      };

      const newAccessToken = await this.generateAccessToken(payload);
      const newRefreshToken = await this.generateRefreshToken(payload);

      // Revoke old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      this.logger.log(`Tokens refreshed for user ${payload.userId}`);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw new Error('Token refresh failed');
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const hashedToken = await this.hashToken(token);
      
      await this.prisma.refreshToken.deleteMany({
        where: { token: hashedToken },
      });

      this.logger.log('Token revoked successfully');
    } catch (error) {
      this.logger.error('Token revocation failed', error);
      throw new Error('Token revocation failed');
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });

      this.logger.log(`Revoked ${result.count} tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all tokens for user ${userId}`, error);
      throw new Error('Token revocation failed');
    }
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}