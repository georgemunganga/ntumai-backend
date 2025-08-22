import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthenticationService, PasswordManagementService } from './application/services';
import { JwtAuthGuard } from './guards';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthenticationService>;
  let passwordService: jest.Mocked<PasswordManagementService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      registerUser: jest.fn(),
      loginUser: jest.fn(),
      refreshToken: jest.fn(),
      logoutUser: jest.fn(),
      logoutAll: jest.fn(),
      getProfile: jest.fn(),
    };

    const mockPasswordService = {
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthService,
        },
        {
          provide: PasswordManagementService,
          useValue: mockPasswordService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthenticationService);
    passwordService = module.get(PasswordManagementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'Password123!',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.registerUser.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        success: true,
        data: expectedResult.user,
      });
    });

    it('should throw BadRequestException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        phone: '+1234567890',
        password: 'Password123!',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      authService.registerUser.mockRejectedValue(new BadRequestException('User already exists'));

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.loginUser.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.loginUser).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      authService.loginUser.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      authService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(refreshDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      authService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refreshToken(refreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const expectedResult = {
        message: 'Password reset email sent',
      };

      passwordService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(passwordService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      };

      const expectedResult = {
        message: 'Password reset successfully',
      };

      passwordService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(passwordService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for invalid reset token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid-reset-token',
        newPassword: 'NewPassword123!',
      };

      passwordService.resetPassword.mockRejectedValue(new BadRequestException('Invalid or expired reset token'));

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockRequest = {
        user: mockUser,
      };
      const refreshToken = 'valid-refresh-token';

      const expectedResult = {
        success: true,
        message: 'Successfully logged out',
      };

      authService.logoutUser.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockRequest, refreshToken);

      expect(authService.logoutUser).toHaveBeenCalledWith({
        userId: mockUser.id,
        refreshToken: refreshToken,
      });
      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = {
        success: true,
        message: 'Successfully logged out',
      };

      authService.logoutUser.mockResolvedValue(expectedResult);

      const result = await controller.logoutAll(mockRequest);

      expect(authService.logoutUser).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Logged out from all devices successfully',
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const expectedResult = {
        success: true,
        user: mockUser,
      };

      authService.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getProfile).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual(expectedResult);
    });
  });
});