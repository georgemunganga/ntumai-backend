import { User } from '../../domain/entities/user.entity';
import { GetUserProfileResult } from './get-user-profile.use-case';

// Base authentication command
export interface BaseAuthCommand {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceType?: string;
}

// Traditional Authentication Commands
export interface RegisterUserCommand extends BaseAuthCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface LoginUserCommand extends BaseAuthCommand {
  email: string;
  password: string;
}

export interface RefreshTokenCommand {
  refreshToken: string;
  deviceId?: string;
}

export interface LogoutUserCommand {
  userId: string;
  refreshToken?: string;
  deviceId?: string;
}

export interface GetUserProfileCommand {
  userId: string;
}

// Results
export interface AuthenticationResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LogoutResult {
  success: boolean;
  message: string;
}

export interface UserProfileResult {
  user: User;
}

/**
 * Consolidated Authentication Use Case
 * Handles traditional email/password authentication flows
 */
export abstract class AuthenticationUseCase {
  // Core Authentication
  abstract registerUser(command: RegisterUserCommand): Promise<AuthenticationResult>;
  abstract loginUser(command: LoginUserCommand): Promise<AuthenticationResult>;
  
  // Token Management
  abstract refreshToken(command: RefreshTokenCommand): Promise<TokenRefreshResult>;
  abstract logoutUser(command: LogoutUserCommand): Promise<LogoutResult>;
  
  // User Profile
  abstract getUserProfile(command: GetUserProfileCommand): Promise<GetUserProfileResult>;
}