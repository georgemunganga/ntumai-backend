import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RegisterUserUseCase,
  LegacyRegisterUserCommand as RegisterUserCommand,
  RegisterUserResult,
  LoginUserUseCase,
  LegacyLoginUserCommand as LoginUserCommand,
  LoginUserResult,
  RefreshTokenUseCase,
  LegacyRefreshTokenCommand as RefreshTokenCommand,
  RefreshTokenResult,
  LogoutUserUseCase,
  LegacyLogoutUserCommand as LogoutUserCommand,
  LogoutUserResult,
  GetUserProfileUseCase,
  LegacyGetUserProfileCommand as GetUserProfileCommand,
  GetUserProfileResult,
} from '../use-cases';
import { UserRepository } from '../../domain/repositories';
import { UserManagementDomainService } from '../../domain/services';
import { User } from '../../domain/entities';
import { Email, Password, UserRole, Phone } from '../../domain/value-objects';
import { UserRegisteredEvent, UserLoggedInEvent } from '../../domain/events';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtService {
  sign(payload: any, options?: any): string;
  verify(token: string): any;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userManagementService: UserManagementDomainService,
    @Inject('JWT_SERVICE')
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registerUser(command: RegisterUserCommand): Promise<RegisterUserResult> {
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

  async loginUser(command: LoginUserCommand): Promise<LoginUserResult> {
    try {
      // Find user by email (include unverified users for login)
      const user = await this.userRepository.findByEmail(Email.create(command.email), { includeUnverified: true });
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
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

  async refreshToken(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
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
      };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async logoutUser(command: LogoutUserCommand): Promise<LogoutUserResult> {
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

  async getProfile(command: GetUserProfileCommand): Promise<GetUserProfileResult> {
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
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: user.currentRole.value,
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
}