import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuthenticationUseCase,
  RegisterUserCommand,
  LoginUserCommand,
  RefreshTokenCommand,
  LogoutUserCommand,
  GetUserProfileCommand,
  AuthenticationResult,
  TokenRefreshResult,
  LogoutResult,
  GetUserProfileResult,
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
} from '../use-cases';
import { UserRepository } from '../../domain/repositories';
import { UserManagementDomainService } from '../../domain/services';
import { User } from '../../domain/entities';
import { Email, Password, UserRole, Phone } from '../../domain/value-objects';
import { UserRegisteredEvent, UserLoggedInEvent } from '../../domain/events';
import { OtpSecurityAdapter } from './otp-security.adapter';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtService {
  sign(payload: any, options?: any): string;
  verify(token: string): any;
}

@Injectable()
export class AuthenticationService extends AuthenticationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userManagementService: UserManagementDomainService,
    @Inject('JWT_SERVICE')
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly otpSecurityAdapter: OtpSecurityAdapter,
  ) {
    super();
  }

  async registerUser(command: RegisterUserCommand): Promise<AuthenticationResult> {
    try {
      // Check if user already exists
      const existingUserByEmail = await this.userRepository.findByEmail(
        Email.create(command.email),
        { includeInactive: true },
      );
      if (existingUserByEmail) {
        throw new BadRequestException('User with this email already exists');
      }

      if (command.phone) {
        const existingUserByPhone = await this.userRepository.findByPhone(
          command.phone,
          { includeInactive: true },
        );
        if (existingUserByPhone) {
          throw new BadRequestException('User with this phone number already exists');
        }
      }

      // Create value objects
      const email = Email.create(command.email);
      const password = await Password.create(command.password);
      const role = UserRole.create(command.role || 'CUSTOMER');
      const phone = command.phone ? Phone.create(command.phone) : undefined;

      // Create user entity
      const user = await User.create({
        email,
        password,
        firstName: command.firstName,
        lastName: command.lastName,
        phone,
        role,
      });

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(savedUser);

      // Update user with refresh token
      savedUser.addRefreshToken(tokens.refreshToken);
      await this.userRepository.save(savedUser);

      // Emit domain event
      const event = new UserRegisteredEvent({
        userId: savedUser.id,
        email: savedUser.email.value,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.currentRole.value,
        occurredAt: new Date(),
      });
      this.eventEmitter.emit('user.registered', event);

      return {
        user: savedUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async loginUser(command: LoginUserCommand): Promise<AuthenticationResult> {
    try {
      // Validate that either email or phone is provided
      if (!command.email && !command.phoneNumber && !(command.phone && command.countryCode)) {
        throw new BadRequestException('Either email or phone number (E.164 format or phone+countryCode) is required');
      }

      // Find user by email or phone (include unverified users for login)
      let user;
      if (command.email) {
        user = await this.userRepository.findByEmail(Email.create(command.email), { includeUnverified: true });
      } else {
        // Handle phone number - support both E.164 format and legacy phone/countryCode
        let phoneToSearch: string;
        
        if (command.phoneNumber) {
          // New E.164 format (preferred)
          phoneToSearch = command.phoneNumber;
        } else if (command.phone && command.countryCode) {
          // Legacy format - combine country code and phone number
          phoneToSearch = `${command.countryCode}${command.phone}`;
        } else {
          throw new BadRequestException('Phone number must be provided in E.164 format or as phone+countryCode');
        }
        
        user = await this.userRepository.findByPhone(phoneToSearch);
      }
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Authenticate user
      const authenticatedUser = await this.userManagementService.authenticateUser(
        user,
        command.password,
      );

      // Record login
      authenticatedUser.recordLogin();

      // Generate tokens
      const tokens = await this.generateTokens(authenticatedUser);

      // Update user with refresh token
      authenticatedUser.addRefreshToken(tokens.refreshToken);
      await this.userRepository.save(authenticatedUser);

      // Emit domain event
      const event = new UserLoggedInEvent({
        userId: authenticatedUser.id,
        email: authenticatedUser.email.value,
        occurredAt: new Date(),
      });
      this.eventEmitter.emit('user.logged-in', event);

      return {
        user: authenticatedUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  async refreshToken(command: RefreshTokenCommand): Promise<TokenRefreshResult> {
    try {
      // Find user by refresh token
      const user = await this.userRepository.findByRefreshToken(
        command.refreshToken,
      );
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate token refresh eligibility
      this.userManagementService.validateTokenRefreshEligibility(user, command.refreshToken);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update user with new refresh token
      user.addRefreshToken(tokens.refreshToken);
      await this.userRepository.save(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async logoutUser(command: LogoutUserCommand): Promise<LogoutResult> {
    try {
      // Find user by ID
      const user = await this.userRepository.findById(command.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Clear refresh token
      user.clearAllRefreshTokens();
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Successfully logged out',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to logout user',
      };
    }
  }

  async getUserProfile(command: GetUserProfileCommand): Promise<GetUserProfileResult> {
    try {
      const user = await this.userRepository.findById(command.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email.value,
          name: user.fullName,
          role: user.getRole().value,
          phone: user.phone?.value,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email.value,
      role: user.currentRole.value,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h', // 1 hour access token
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: '7d', // 7 days refresh token
      },
    );

    return { accessToken, refreshToken };
  }

  async registerOtp(command: GenerateRegistrationOtpCommand): Promise<OtpGenerationResult> {
    return this.otpSecurityAdapter.generateRegistrationOtp(command);
  }

  async verifyOtp(command: VerifyOtpCommand): Promise<OtpVerificationResult> {
    return this.otpSecurityAdapter.verifyOtp(command);
  }

  async completeRegistration(command: CompleteRegistrationCommand): Promise<RegistrationResult> {
    return this.otpSecurityAdapter.completeRegistration(command);
  }

  async loginOtp(command: GenerateLoginOtpCommand): Promise<OtpGenerationResult> {
    return this.otpSecurityAdapter.generateLoginOtp(command);
  }

  async completeLogin(command: VerifyOtpCommand): Promise<LoginResult> {
    return this.otpSecurityAdapter.completeLogin(command);
  }
<<<<<<< HEAD

  async generatePasswordResetOtp(command: GeneratePasswordResetOtpCommand): Promise<OtpGenerationResult> {
    return this.otpSecurityAdapter.generatePasswordResetOtp(command);
  }

  async completePasswordReset(command: CompletePasswordResetCommand): Promise<PasswordResetResult> {
    return this.otpSecurityAdapter.completePasswordReset(command);
  }
=======
>>>>>>> main
}