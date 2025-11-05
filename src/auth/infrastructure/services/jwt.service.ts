import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
  type: 'access' | 'refresh' | 'registration';
}

export interface RegistrationTokenPayload {
  identifier: string;
  identifierType: 'email' | 'phone';
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    payload: Omit<JwtPayload, 'type'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get<string>('jwt.access.secret'),
        expiresIn: this.configService.get<number>('jwt.access.ttl'),
      },
    );
  }

  async generateRefreshToken(
    payload: Omit<JwtPayload, 'type'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refresh.secret'),
        expiresIn: this.configService.get<number>('jwt.refresh.ttl'),
      },
    );
  }

  async generateRegistrationToken(
    payload: RegistrationTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'registration' },
      {
        secret: this.configService.get<string>('jwt.registration.secret'),
        expiresIn: this.configService.get<number>('jwt.registration.ttl'),
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.access.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.refresh.secret'),
    });
  }

  async verifyRegistrationToken(
    token: string,
  ): Promise<RegistrationTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.registration.secret'),
    });
  }

  async hashToken(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('hex');
  }

  async compareToken(token: string, hash: string): Promise<boolean> {
    const tokenHash = await this.hashToken(token);
    if (tokenHash.length !== hash.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(tokenHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  }

  getAccessTokenTtl(): number {
    return this.configService.get<number>('jwt.access.ttl') || 3600;
  }

  getRefreshTokenTtl(): number {
    return this.configService.get<number>('jwt.refresh.ttl') || 604800;
  }

  getRegistrationTokenTtl(): number {
    return this.configService.get<number>('jwt.registration.ttl') || 600;
  }
}
