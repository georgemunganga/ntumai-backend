import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/users/application/services/user.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { JwtToken } from '../../domain/value-objects/jwt-token.vo';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(phoneNumber?: string, email?: string): Promise<void> {
    if (!phoneNumber && !email) {
      throw new BadRequestException(
        'Phone number or email must be provided.',
      );
    }

    const identifier = phoneNumber || email;

    // Create or get user
    await this.userService.createOrUpdateUser(phoneNumber, email);

    // Request OTP
    await this.otpService.requestOtp(identifier!);
  }

  async verifyOtp(
    otp: string,
    phoneNumber?: string,
    email?: string,
  ): Promise<JwtToken> {
    if (!phoneNumber && !email) {
      throw new BadRequestException(
        'Phone number or email must be provided.',
      );
    }

    const identifier = phoneNumber || email;

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(identifier!, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Get or create user
    let user: UserEntity | null = null;
    if (phoneNumber) {
      user = await this.userService.getUserByPhoneNumber(phoneNumber);
    } else if (email) {
      user = await this.userService.getUserByEmail(email);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Activate user if pending
    if (user.status === 'PENDING_VERIFICATION') {
      user = await this.userService.activateUser(user);
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: UserEntity, activeRole?: string): JwtToken {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      activeRole: activeRole || 'CUSTOMER',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn:
        this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
    });

    return new JwtToken(
      accessToken,
      refreshToken,
      Date.now() + 15 * 60 * 1000,
    );
  }
}
