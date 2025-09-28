import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { OtpApplicationService } from '../../../security/application/services/otp-application.service';

import { JwtAdapter } from '../../infrastructure/services/jwt.adapter';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.value-object';
import { Phone } from '../../domain/value-objects/phone.value-object';
import { UserRole } from '../../domain/value-objects/user-role.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { User } from '../../domain/entities/user.entity';
import {
  OtpManagementUseCase,
  GenerateRegistrationOtpCommand,
  GenerateLoginOtpCommand,
  GeneratePasswordResetOtpCommand,
  VerifyOtpCommand,
  CompleteRegistrationCommand,
  CompletePasswordResetCommand,
  OtpGenerationResult,
  OtpVerificationResult,
  RegistrationResult,
  LoginResult,
  PasswordResetResult,
  RequestOtpChallengeCommand,
  OtpChallengeResult,
  VerifyOtpChallengeCommand,
  OtpChallengeVerificationResult,
  CompleteRegistrationWithTokenCommand,
} from '../use-cases/otp-management.use-case';

/**
 * Adapter service that bridges Auth module's OTP interfaces with SecurityModule's OtpService
 * This maintains backward compatibility while leveraging the centralized security functionality
 */
@Injectable()
export class OtpSecurityAdapter extends OtpManagementUseCase {
  private readonly logger = new Logger(OtpSecurityAdapter.name);

  constructor(
    private readonly otpService: OtpApplicationService,
    private readonly jwtAdapter: JwtAdapter,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async generateRegistrationOtp(command: GenerateRegistrationOtpCommand): Promise<OtpGenerationResult> {
    try {
      const { identifier, channel } = this.resolveContact({
        phone: command.phone,
        countryCode: command.countryCode,
        email: command.email,
      });

      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'registration',
        expiryMinutes: 5,
        codeLength: 6,
        alphanumeric: false,
        maxAttempts: 5,
        resendCooldownSeconds: 60,
      });

      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('Registration OTP delivery failed', {
          identifier,
          channel,
          error: otpResult.deliveryStatus.error,
        });
      }

      return {
        success: true,
        message: `OTP challenge created for ${this.maskIdentifier(identifier, channel)}`,
        requestId: otpResult.otpId,
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('Registration OTP generation failed', error);
      throw error;
    }
  }

  async generateLoginOtp(command: GenerateLoginOtpCommand): Promise<OtpGenerationResult> {
    try {
      const { identifier, channel } = this.resolveContact({
        phone: command.phone,
        countryCode: command.countryCode,
        email: command.email,
      });

      const user = await this.findUserByIdentifier(identifier, channel === 'sms');

      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'login',
        expiryMinutes: 5,
        codeLength: 6,
        alphanumeric: false,
        maxAttempts: 5,
        resendCooldownSeconds: 60,
      });

      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('Login OTP delivery failed', {
          identifier,
          userId: user?.id,
          error: otpResult.deliveryStatus.error,
        });
      }

      return {
        success: true,
        message: `If an account exists we have sent a code to ${this.maskIdentifier(identifier, channel)}`,
        requestId: otpResult.otpId,
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('Login OTP generation failed', error);
      throw error;
    }
  }

  async generatePasswordResetOtp(command: GeneratePasswordResetOtpCommand): Promise<OtpGenerationResult> {
    try {
      const { identifier, channel } = this.resolveContact({
        phone: command.phone,
        countryCode: command.countryCode,
        email: command.email,
      });

      const user = await this.findUserByIdentifier(identifier, channel === 'sms');

      if (!user) {
        throw new BadRequestException('User not found with this phone number or email');
      }

      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'password_reset',
        expiryMinutes: 10,
        codeLength: 6,
        alphanumeric: false,
        maxAttempts: 5,
        resendCooldownSeconds: 60,
      });

      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('Password reset OTP delivery failed', {
          identifier,
          userId: user.id,
          error: otpResult.deliveryStatus.error,
        });
      }

      return {
        success: true,
        message: `Password reset OTP sent successfully to ${this.maskIdentifier(identifier, channel)}`,
        requestId: otpResult.otpId,
        expiresAt: otpResult.expiresAt,
      };
    } catch (error) {
      this.logger.error('Password reset OTP generation failed', error);
      throw error;
    }
  }

  async verifyOtp(command: VerifyOtpCommand): Promise<OtpVerificationResult> {
    try {
      const { identifier } = this.resolveContact({
        phone: command.phone,
        countryCode: command.countryCode,
        email: command.email,
      });

      const validationResult = await this.otpService.validateOtp({
        identifier,
        code: command.otp,
        requestId: command.requestId,
        challengeId: command.requestId,
      });

      if (!validationResult.isValid) {
        if (validationResult.isExpired) {
          throw new BadRequestException('OTP has expired');
        }

        if (validationResult.isLocked) {
          throw new BadRequestException('Too many invalid attempts. Challenge locked');
        }

        return {
          success: false,
          message: 'Invalid OTP',
          isValid: false,
        };
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        isValid: true,
      };
    } catch (error) {
      this.logger.error('OTP verification failed', error);
      return {
        success: false,
        message: 'OTP verification failed',
        isValid: false,
      };
    }
  }

  async requestOtpChallenge(command: RequestOtpChallengeCommand): Promise<OtpChallengeResult> {
    try {
      const { identifier, channel } = this.resolveContact({
        phone: command.phone,
        countryCode: command.countryCode,
        email: command.email,
      });

      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: command.purpose === 'login' ? 'login' : 'registration',
        expiryMinutes: 5,
        codeLength: 6,
        alphanumeric: false,
        maxAttempts: 5,
        resendCooldownSeconds: 60,
      });

      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('OTP challenge delivery failed', {
          identifier,
          purpose: command.purpose,
          error: otpResult.deliveryStatus.error,
        });
      }

      return {
        success: true,
        challengeId: otpResult.otpId,
        expiresAt: otpResult.expiresAt,
        resendAvailableAt: otpResult.resendAvailableAt,
        attemptsAllowed: otpResult.maxAttempts,
        destination: this.maskIdentifier(identifier, channel),
      };
    } catch (error) {
      this.logger.error('OTP challenge request failed', error);
      throw error;
    }
  }

  async verifyOtpChallenge(command: VerifyOtpChallengeCommand): Promise<OtpChallengeVerificationResult> {
    try {
      const validation = await this.otpService.validateOtp({
        code: command.otp,
        challengeId: command.challengeId,
        requestId: command.challengeId,
      });

      if (!validation.isValid) {
        if (validation.isExpired) {
          throw new BadRequestException('OTP has expired');
        }

        if (validation.isLocked) {
          throw new BadRequestException('Too many invalid attempts. Challenge locked');
        }

        throw new UnauthorizedException('Invalid OTP');
      }

      const identifier = validation.identifier!;
      const isPhone = !identifier.includes('@');
      const user = await this.findUserByIdentifier(identifier, isPhone);

      if (user) {
        const tokens = this.generateJwtPair(user);
        user.addRefreshToken(tokens.refreshToken);
        await this.userRepository.save(user);

        return {
          success: true,
          isNewUser: false,
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      }

      const registrationToken = this.jwtAdapter.sign(
        {
          sub: 'registration',
          identifier,
          challengeId: validation.challengeId,
          purpose: 'register',
          channel: isPhone ? 'phone' : 'email',
        },
        { expiresIn: '10m' },
      );

      return {
        success: true,
        isNewUser: true,
        registrationToken,
      };
    } catch (error) {
      this.logger.error('OTP challenge verification failed', error);
      throw error;
    }
  }

  async completeRegistration(command: CompleteRegistrationCommand): Promise<RegistrationResult> {
    try {
      const { otp, requestId, phone, countryCode, email, firstName, lastName, role } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phone, countryCode, email });
      if (!otpVerification.isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Create user - ensure we have either email or phone
      if (!email && !(phone && countryCode)) {
        throw new BadRequestException('Either email or both phone and country code are required for registration');
      }

      const userRole = UserRole.create(role || 'CUSTOMER');
      const userPassword = await Password.create(this.generateInternalPassword());

      // If no email provided, create a temporary one based on phone
      const phoneVo = phone && countryCode ? Phone.fromParts(countryCode, phone) : undefined;
      const userEmail = email
        ? Email.create(email)
        : Email.create(`temp_${phoneVo?.nationalNumber ?? ''}@temp.local`);
      const userPhone = phoneVo;

      const user = await User.create({
        firstName,
        lastName,
        email: userEmail,
        phone: userPhone,
        password: userPassword,
        role: userRole,
        isEmailVerified: !!email,
        isPhoneVerified: !!phoneVo,
      });

      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const payload = {
        sub: savedUser.id,
        email: savedUser.email.value,
        role: savedUser.role.value,
      };

      const accessToken = this.jwtAdapter.sign(payload, {
        expiresIn: '1h', // 1 hour access token
      });

      const refreshToken = this.jwtAdapter.sign(
        { sub: savedUser.id },
        {
          expiresIn: '7d', // 7 days refresh token
        },
      );

      return {
        user: savedUser,
        accessToken,
        refreshToken,
        isNewUser: true,
      };
    } catch (error) {
      this.logger.error('Registration completion failed', error);
      throw error;
    }
  }

  async completeRegistrationWithToken(command: CompleteRegistrationWithTokenCommand): Promise<RegistrationResult> {
    try {
      const payload = this.jwtAdapter.verify(command.registrationToken);

      if (!payload || payload.sub !== 'registration') {
        throw new UnauthorizedException('Invalid registration token');
      }

      const identifier = payload.identifier as string | undefined;
      const channel = (payload.channel as string | undefined) ?? (identifier?.includes('@') ? 'email' : 'phone');

      if (!identifier) {
        throw new BadRequestException('Registration token is missing identifier details');
      }

      if (payload.purpose !== 'register') {
        throw new BadRequestException('Registration token has already been used or is not intended for registration');
      }

      const existingUser = await this.findUserByIdentifier(identifier, channel === 'phone');
      if (existingUser) {
        throw new BadRequestException('User already exists for this identifier');
      }

      const userRole = UserRole.create(command.role || 'CUSTOMER');
      const password = command.password
        ? await Password.create(command.password)
        : await Password.create(this.generateInternalPassword());

      const email = channel === 'email'
        ? Email.create(identifier)
        : Email.create(`temp_${identifier.replace(/[^0-9]/g, '')}@temp.local`);

      const phone = channel === 'phone' ? Phone.create(identifier) : undefined;

      const user = await User.create({
        firstName: command.firstName,
        lastName: command.lastName,
        email,
        phone,
        password,
        role: userRole,
        isEmailVerified: channel === 'email',
        isPhoneVerified: channel === 'phone',
      });

      const savedUser = await this.userRepository.save(user);
      const tokens = this.generateJwtPair(savedUser);

      savedUser.addRefreshToken(tokens.refreshToken);
      await this.userRepository.save(savedUser);

      return {
        user: savedUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: true,
      };
    } catch (error) {
      this.logger.error('Registration via token failed', error);
      throw error;
    }
  }

  async completeLogin(command: VerifyOtpCommand): Promise<LoginResult> {
    try {
      const { otp, requestId, phone, countryCode, email } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phone, countryCode, email });
      if (!otpVerification.isValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      const phoneVo = phone && countryCode ? Phone.fromParts(countryCode, phone) : undefined;
      const identifier = phoneVo?.value ?? email;

      if (!identifier) {
        throw new UnauthorizedException('Missing identifier for login completion');
      }

      const user = await this.findUserByIdentifier(identifier, !!phoneVo && !email);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      user.recordLogin();
      const tokens = this.generateJwtPair(user);
      user.addRefreshToken(tokens.refreshToken);
      await this.userRepository.save(user);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: false,
      };
    } catch (error) {
      this.logger.error('Login completion failed', error);
      throw error;
    }
  }

  async completePasswordReset(command: CompletePasswordResetCommand): Promise<PasswordResetResult> {
    try {
      const { otp, requestId, newPassword, phone, countryCode, email } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phone, countryCode, email });
      if (!otpVerification.isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Find user
      let user: User | null = null;
      const phoneVo = phone && countryCode ? Phone.fromParts(countryCode, phone) : undefined;
      if (phoneVo) {
        user = await this.userRepository.findByPhone(phoneVo.value);
      }
      if (!user && email) {
        const emailVO = Email.create(email);
        user = await this.userRepository.findByEmail(emailVO);
      }

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Update password
      const password = await Password.create(newPassword);
      await user.changePassword(password);
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      this.logger.error('Password reset completion failed', error);
      throw error;
    }
  }

  private resolveContact({
    phone,
    countryCode,
    email,
  }: {
    phone?: string;
    countryCode?: string;
    email?: string;
  }): { identifier: string; channel: 'sms' | 'email' } {
    if (email) {
      const emailVo = Email.create(email);
      return { identifier: emailVo.value, channel: 'email' };
    }

    if (phone && countryCode) {
      const phoneVo = Phone.fromParts(countryCode, phone);
      return { identifier: phoneVo.value, channel: 'sms' };
    }

    throw new BadRequestException('Either email or both phone and country code are required');
  }

  private maskIdentifier(identifier: string, channel: 'sms' | 'email'): string {
    if (channel === 'email') {
      const [local, domain] = identifier.split('@');
      if (!local || !domain) {
        return '***';
      }
      const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local[0]}***${local.slice(-1)}`;
      return `${maskedLocal}@${domain}`;
    }

    const visibleDigits = identifier.slice(-4);
    return `${identifier.slice(0, 3)}****${visibleDigits}`;
  }

  private async findUserByIdentifier(identifier: string, isPhone: boolean): Promise<User | null> {
    try {
      if (isPhone) {
        const phone = Phone.create(identifier);
        return await this.userRepository.findByPhone(phone.value);
      }

      const email = Email.create(identifier);
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      this.logger.debug('Failed to locate user by identifier', { identifier, isPhone, error: error?.message });
      return null;
    }
  }

  private generateJwtPair(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email.value,
      role: user.role.value,
    };

    const accessToken = this.jwtAdapter.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtAdapter.sign({ sub: user.id }, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  private generateInternalPassword(length = 16): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*()-_=+[]{}<>?';
    const pools = [uppercase, lowercase, digits, special];

    const requiredChars = pools.map((pool) => pool[randomInt(pool.length)]);
    const allChars = pools.join('');

    while (requiredChars.length < length) {
      requiredChars.push(allChars[randomInt(allChars.length)]);
    }

    for (let i = requiredChars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
    }

    return requiredChars.join('');
  }
}
