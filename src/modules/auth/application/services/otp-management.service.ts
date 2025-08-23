import { Injectable, BadRequestException, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationAdapter } from '../../infrastructure/services/notification.adapter';
import { JwtAdapter } from '../../infrastructure/services/jwt.adapter';
import { JWT_SERVICE_TOKEN, NOTIFICATION_SERVICE_TOKEN } from '../../infrastructure/infrastructure.module';
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
import { OTPType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OtpManagementService extends OtpManagementUseCase {
  private readonly logger = new Logger(OtpManagementService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_SERVICE_TOKEN) private readonly notificationAdapter: NotificationAdapter,
    @Inject(JWT_SERVICE_TOKEN) private readonly jwtAdapter: JwtAdapter,
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
      const existingUser = email 
         ? await this.userRepository.findByEmail(Email.create(email))
         : phoneNumber ? await this.userRepository.findByPhone(phoneNumber) : null;
      if (existingUser) {
        throw new BadRequestException('User already exists with this email or phone number');
      }

      const requestId = uuidv4();
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP in database
      await this.prisma.oTPVerification.create({
        data: {
          requestId,
          phoneNumber: phoneNumber || email || '',
          countryCode: countryCode || '+1',
          otp: otp,
          type: 'registration',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send OTP via SMS or Email
      if (phoneNumber) {
        await this.notificationAdapter.sendSMS(
          `${countryCode}${phoneNumber}`,
          `Your NTUMAI registration OTP is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        );
      } else if (email) {
        // TODO: Create OTP email template
        this.logger.log(`Registration OTP for ${email}: ${otp}`);
      }

      this.logger.log(`Registration OTP generated for ${phoneNumber || email}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        requestId,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to generate registration OTP', error);
      throw error;
    }
  }

  async generateLoginOtp(command: GenerateLoginOtpCommand): Promise<OtpGenerationResult> {
    try {
      const { phoneNumber, email, countryCode, deviceId, deviceType } = command;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Either phone number or email is required');
      }

      // Check if user exists
      if (!email && !phoneNumber) {
         throw new BadRequestException('Either email or phone number is required');
       }
       
       if (!email && !phoneNumber) {
         throw new BadRequestException('Either email or phone number is required');
       }
       
       const user = email 
          ? await this.userRepository.findByEmail(Email.create(email))
          : await this.userRepository.findByPhone(phoneNumber!);
      if (!user) {
        throw new BadRequestException('User not found with this email or phone number');
      }

      const requestId = uuidv4();
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP in database
      await this.prisma.oTPVerification.create({
        data: {
          requestId,
          phoneNumber: phoneNumber || email || '',
          countryCode: countryCode || '+1',
          otp: otp,
          type: 'login',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send OTP via SMS or Email
      if (phoneNumber) {
        await this.notificationAdapter.sendSMS(
          `${countryCode}${phoneNumber}`,
          `Your NTUMAI login OTP is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        );
      } else if (email) {
        // TODO: Create OTP email template
        this.logger.log(`Login OTP for ${email}: ${otp}`);
      }

      this.logger.log(`Login OTP generated for ${phoneNumber || email}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        requestId,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to generate login OTP', error);
      throw error;
    }
  }

  async generatePasswordResetOtp(command: GeneratePasswordResetOtpCommand): Promise<OtpGenerationResult> {
    try {
      const { phoneNumber, email, countryCode } = command;

      if (!phoneNumber && !email) {
        throw new BadRequestException('Either phone number or email is required');
      }

      // Check if user exists
      if (!email && !phoneNumber) {
         throw new BadRequestException('Either email or phone number is required');
       }
       
       const user = email 
          ? await this.userRepository.findByEmail(Email.create(email))
          : await this.userRepository.findByPhone(phoneNumber!);
      if (!user) {
        throw new BadRequestException('User not found with this email or phone number');
      }

      const requestId = uuidv4();
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP in database
      await this.prisma.oTPVerification.create({
        data: {
          requestId,
          phoneNumber: phoneNumber || email || '',
          countryCode: countryCode || '+1',
          otp: otp,
          type: 'password_reset',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Send OTP via SMS or Email
      if (phoneNumber) {
        await this.notificationAdapter.sendSMS(
          `${countryCode}${phoneNumber}`,
          `Your NTUMAI password reset OTP is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        );
      } else if (email) {
        // TODO: Create OTP email template
        this.logger.log(`Password reset OTP for ${email}: ${otp}`);
      }

      this.logger.log(`Password reset OTP generated for ${phoneNumber || email}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        requestId,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to generate password reset OTP', error);
      throw error;
    }
  }

  async verifyOtp(command: VerifyOtpCommand): Promise<OtpVerificationResult> {
    try {
      const { otp, requestId, phoneNumber, email } = command;

      if (!requestId && !phoneNumber && !email) {
        throw new BadRequestException('Request ID or contact information is required');
      }

      // Find OTP record
      const otpRecord = await this.prisma.oTPVerification.findFirst({
           where: {
             OR: [
               { requestId },
               { phoneNumber: phoneNumber || email || '' },
             ],
             isVerified: false,
             expiresAt: { gt: new Date() },
           },
           orderBy: { createdAt: 'desc' },
         });

      if (!otpRecord) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Check attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        throw new BadRequestException('Maximum OTP attempts exceeded');
      }

      // Increment attempts
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      // Verify OTP
      if (otpRecord.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      // Mark as verified
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isVerified: true },
      });

      this.logger.log(`OTP verified successfully for ${otpRecord.phoneNumber}`);

      return {
        success: true,
        message: 'OTP verified successfully',
        isValid: true,
      };
    } catch (error) {
      this.logger.error('Failed to verify OTP', error);
      return {
        success: false,
        message: error.message || 'OTP verification failed',
        isValid: false,
      };
    }
  }

  async completeRegistration(command: CompleteRegistrationCommand): Promise<RegistrationResult> {
    try {
      const { firstName, lastName, password, role = 'CUSTOMER', otp, requestId, phoneNumber, email } = command;

      // Verify OTP first
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Validate that at least email or phone is provided
       if (!email && !phoneNumber) {
         throw new BadRequestException('Either email or phone number is required');
       }

       // Create value objects
       const emailObj = email ? Email.create(email) : Email.create('temp@temp.com'); // Temporary workaround
       const phoneObj = phoneNumber ? Phone.create(phoneNumber) : undefined;
       const roleObj = UserRole.create(role || 'CUSTOMER');
       const passwordObj = await Password.create(password);

       // Create user entity
       const user = await User.create({
         email: emailObj,
         phone: phoneObj,
         role: roleObj,
         password: passwordObj,
         firstName,
         lastName,
       });

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const accessToken = this.jwtAdapter.sign({ userId: savedUser.id, email: savedUser.email?.value, role: savedUser.currentRole.value });
      const refreshToken = this.jwtAdapter.sign({ userId: savedUser.id }, { expiresIn: '7d' });

      this.logger.log(`User registration completed for ${email || phoneNumber}`);

      return {
        user: savedUser,
        accessToken,
        refreshToken,
        isNewUser: true,
      };
    } catch (error) {
      this.logger.error('Failed to complete registration', error);
      throw error;
    }
  }

  async completeLogin(command: VerifyOtpCommand): Promise<LoginResult> {
    try {
      const { otp, requestId, phoneNumber, email } = command;

      // Verify OTP first
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Find user
      const user = email 
         ? await this.userRepository.findByEmail(Email.create(email))
         : phoneNumber ? await this.userRepository.findByPhone(phoneNumber) : null;
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate tokens
      const accessToken = this.jwtAdapter.sign({ userId: user.id, email: user.email?.value, role: user.currentRole.value });
      const refreshToken = this.jwtAdapter.sign({ userId: user.id }, { expiresIn: '7d' });

      this.logger.log(`User login completed for ${email || phoneNumber}`);

      return {
        user,
        accessToken,
        refreshToken,
        isNewUser: false,
      };
    } catch (error) {
      this.logger.error('Failed to complete login', error);
      throw error;
    }
  }

  async completePasswordReset(command: CompletePasswordResetCommand): Promise<PasswordResetResult> {
    try {
      const { newPassword, otp, requestId, phoneNumber, email } = command;

      // Verify OTP first
      const otpVerification = await this.verifyOtp({ otp, requestId, phoneNumber, email });
      if (!otpVerification.isValid) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Find user
      const user = email 
        ? await this.userRepository.findByEmail(Email.create(email))
        : await this.userRepository.findByPhone(phoneNumber!);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Update user password
         const newPasswordObj = await Password.create(newPassword);
         const updatedUser = await User.create({
           email: user.email,
           firstName: user.firstName,
           lastName: user.lastName,
           phone: user.phone,
           role: user.currentRole,
           password: newPasswordObj,
         });
         await this.userRepository.save(updatedUser);

      this.logger.log(`Password reset completed for ${email || phoneNumber}`);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error('Failed to complete password reset', error);
      throw error;
    }
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}