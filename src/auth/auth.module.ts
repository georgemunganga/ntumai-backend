import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { CommunicationsModule } from '../communications/communications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaOtpChallengeRepository } from './infrastructure/repositories/prisma-otp-challenge.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { JwtTokenService } from './infrastructure/services/jwt.service';
import { OtpService } from './infrastructure/services/otp.service';
import { EmailService } from './infrastructure/services/email.service';
import { SmsService } from './infrastructure/services/sms.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    CommunicationsModule,
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    // Application Services
    AuthService,

    // Infrastructure Services
    JwtTokenService,
    OtpService,
    EmailService,
    SmsService,

    // Repositories
    PrismaUserRepository,
    PrismaOtpChallengeRepository,
    PrismaRefreshTokenRepository,

    // Guards & Strategies
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
