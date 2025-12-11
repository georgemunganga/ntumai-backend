import { Module } from '@nestjs/common';
import { AuthController } from './interfaces/controllers/auth.controller';
import { CommunicationModule } from '../communication/communication.module';
import { AuthService } from './application/services/auth.service';
import { OtpService } from './application/services/otp.service';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    CommunicationModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthService,
    OtpService,
    UserRepository,
    PrismaService,
    // Add other services like OtpService, HashService here
  ],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
