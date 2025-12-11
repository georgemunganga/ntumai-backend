import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/modules/auth/infrastructure/repositories/user.repository';
import { UserEntity } from 'src/modules/auth/domain/entities/user.entity';
import { JwtToken } from 'src/modules/auth/domain/value-objects/jwt-token.vo';
import { OtpService } from 'src/modules/auth/application/services/otp.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(phoneNumber?: string, email?: string): Promise<void> {
    if (!phoneNumber && !email) {
      throw new BadRequestException('Phone number or email must be provided.');
    }

    let user: UserEntity | null = null;
    let identifier: string;

    if (phoneNumber) {
      user = await this.userRepository.findByPhoneNumber(phoneNumber);
      identifier = phoneNumber;
    } else if (email) {
      user = await this.userRepository.findByEmail(email);
      identifier = email;
    } else {
      throw new BadRequestException('Invalid request: Missing phone number or email.');
    }

    if (!user) {
      // If user does not exist, create a new user with a temporary status
      user = await this.userRepository.save(new UserEntity({ phoneNumber, email, status: 'PENDING_VERIFICATION' }));
    }

    // 2. Request OTP
    await this.otpService.requestOtp(identifier);
  }

  async verifyOtp(otp: string, phoneNumber?: string, email?: string): Promise<JwtToken> {
    if (!phoneNumber && !email) {
      throw new BadRequestException('Phone number or email must be provided.');
    }

    let user: UserEntity | null = null;
    let identifier: string;

    if (phoneNumber) {
      user = await this.userRepository.findByPhoneNumber(phoneNumber);
      identifier = phoneNumber;
    } else if (email) {
      user = await this.userRepository.findByEmail(email);
      identifier = email;
    } else {
      throw new BadRequestException('Invalid request: Missing phone number or email.');
    }

    // 1. Verify OTP
    const isValid = await this.otpService.verifyOtp(identifier, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // 2. Find user
    if (!user) {
      // Should not happen if requestOtp was called, but as a safeguard
      throw new UnauthorizedException('User not found');
    }

    // 3. Update user status to active (onboarding complete)
    if (user.status === 'PENDING_VERIFICATION') {
      user.status = 'ACTIVE';
      user = await this.userRepository.save(user);
    }

    return this.generateTokens(user);
  }

  async switchRole(userId: string, roleType: string): Promise<JwtToken> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // if (!user.canSwitchRole(roleType)) { // Assuming canSwitchRole method on UserEntity
    //   throw new ForbiddenException(`Cannot switch to role ${roleType}`);
    // }

    return this.generateTokens(user, roleType);
  }

  private generateTokens(user: UserEntity, activeRole?: string): JwtToken {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      activeRole: activeRole || 'CUSTOMER', // Placeholder for initial role
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    // NOTE: The expiration time should be calculated based on the actual JWT_EXPIRATION setting
    return new JwtToken(accessToken, refreshToken, Date.now() + 15 * 60 * 1000);
  }
}
