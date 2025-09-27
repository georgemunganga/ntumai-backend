import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
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
      const { phoneNumber, email, countryCode, deviceId, deviceType } = command;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Either phone number or email is required');
      }

      // Check if user already exists
      let existingUser: User | null = null;
      if (phoneNumber) {
        const phone = Phone.create(phoneNumber);
        existingUser = await this.userRepository.findByPhone(phone.value);
      }
      if (!existingUser && email) {
        const emailVO = Email.create(email);
        existingUser = await this.userRepository.findByEmail(emailVO);
      }

      if (existingUser) {
        throw new BadRequestException('User already exists with this phone number or email');
      }

      // Generate OTP using SecurityModule
      const identifier = phoneNumber ?? email;
      if (!identifier) {
        throw new BadRequestException('Either phone number or email is required');
      }
      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'registration',
        expiryMinutes: 5,
        codeLength: 6,
        alphanumeric: false,
      });

      // OTP generation and delivery is handled internally by OtpApplicationService
      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('OTP delivery failed', { 
          phoneNumber, 
          email, 
          error: otpResult.deliveryStatus.error 
        });
      }

      return {
        success: true,
        message: `OTP sent successfully to ${identifier}`,
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
      const { phoneNumber, email, deviceId, deviceType } = command;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Either phone number or email is required');
      }

      // Find existing user
      let user: User | null = null;
      if (phoneNumber) {
        const phone = Phone.create(phoneNumber);
        user = await this.userRepository.findByPhone(phone.value);
      }
      if (!user && email) {
        const emailVO = Email.create(email);
        user = await this.userRepository.findByEmail(emailVO);
      }

      if (!user) {
        throw new BadRequestException('User not found with this phone number or email');
      }

      // Generate OTP using SecurityModule
      const identifier = phoneNumber ?? email;
      if (!identifier) {
        throw new BadRequestException('Either phone number or email is required');
      }
      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'login',
        expiryMinutes: 5,
        codeLength: 6,
        alphanumeric: false,
      });

      // OTP generation and delivery is handled internally by OtpApplicationService
      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('OTP delivery failed', { 
          userId: user.id, 
          phoneNumber, 
          email, 
          error: otpResult.deliveryStatus.error 
        });
      }

      return {
        success: true,
        message: `OTP sent successfully to ${identifier}`,
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
      const { phoneNumber, email } = command;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Either phone number or email is required');
      }

      // Find existing user
      let user: User | null = null;
      if (phoneNumber) {
        const phone = Phone.create(phoneNumber);
        user = await this.userRepository.findByPhone(phone.value);
      }
      if (!user && email) {
        const emailVO = Email.create(email);
        user = await this.userRepository.findByEmail(emailVO);
      }

      if (!user) {
        throw new BadRequestException('User not found with this phone number or email');
      }

      // Generate OTP using SecurityModule
      const identifier = phoneNumber ?? email;
      if (!identifier) {
        throw new BadRequestException('Either phone number or email is required');
      }
      const otpResult = await this.otpService.generateOtp({
        identifier,
        purpose: 'password_reset',
        expiryMinutes: 10, // Longer expiry for password reset
        codeLength: 6,
        alphanumeric: false,
      });

      // OTP generation and delivery is handled internally by OtpApplicationService
      if (!otpResult.deliveryStatus.sent) {
        this.logger.warn('Password reset OTP delivery failed', { 
          userId: user.id, 
          phoneNumber, 
          email, 
          error: otpResult.deliveryStatus.error 
        });
      }

      return {
        success: true,
        message: `Password reset OTP sent successfully to ${identifier}`,
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
      const { otp, requestId, phoneNumber, email } = command;

      if (!requestId) {
        throw new BadRequestException('Request ID is required for OTP verification');
      }

      // Validate OTP using SecurityModule
      const identifier = phoneNumber ?? email;
      if (!identifier) {
        throw new BadRequestException('Either phone number or email is required for OTP verification');
      }
      const validationResult = await this.otpService.validateOtp({
        identifier,
        code: otp,
        requestId,
      });

      return {
        success: validationResult.isValid,
        message: validationResult.isValid ? 'OTP verified successfully' : 'Invalid OTP',
        isValid: validationResult.isValid,
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

  async completeRegistration(command: CompleteRegistrationCommand): Promise<RegistrationResult> {
    try {
      const { otp, requestId, phoneNumber, email, firstName, lastName, password, role } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Create user - ensure we have either email or phone
      if (!email && !phoneNumber) {
        throw new BadRequestException('Either email or phone number is required for registration');
      }

      const userRole = UserRole.create(role || 'CUSTOMER');
      const userPassword = await Password.create(password);
      
      // If no email provided, create a temporary one based on phone
      const userEmail = email 
        ? Email.create(email) 
        : Email.create(`temp_${phoneNumber?.replace(/[^0-9]/g, '')}@temp.local`);
      const userPhone = phoneNumber ? Phone.create(phoneNumber) : undefined;

      const user = await User.create({
        firstName,
        lastName,
        email: userEmail,
        phone: userPhone,
        password: userPassword,
        role: userRole,
        isEmailVerified: !!email,
        isPhoneVerified: !!phoneNumber,
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

  async completeLogin(command: VerifyOtpCommand): Promise<LoginResult> {
    try {
      const { otp, requestId, phoneNumber, email } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      // Find user
      let user: User | null = null;
      if (phoneNumber) {
        const phone = Phone.create(phoneNumber);
        user = await this.userRepository.findByPhone(phone.value);
      }
      if (!user && email) {
        const emailVO = Email.create(email);
        user = await this.userRepository.findByEmail(emailVO);
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate tokens
      const payload = {
        sub: user.id,
        email: user.email.value,
        role: user.role.value,
      };

      const accessToken = this.jwtAdapter.sign(payload, {
        expiresIn: '1h', // 1 hour access token
      });

      const refreshToken = this.jwtAdapter.sign(
        { sub: user.id },
        {
          expiresIn: '7d', // 7 days refresh token
        },
      );

      return {
        user,
        accessToken,
        refreshToken,
        isNewUser: false,
      };
    } catch (error) {
      this.logger.error('Login completion failed', error);
      throw error;
    }
  }

  async completePasswordReset(command: CompletePasswordResetCommand): Promise<PasswordResetResult> {
    try {
      const { otp, requestId, newPassword, phoneNumber, email } = command;

      // First verify the OTP
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Find user
      let user: User | null = null;
      if (phoneNumber) {
        const phone = Phone.create(phoneNumber);
        user = await this.userRepository.findByPhone(phone.value);
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
}
