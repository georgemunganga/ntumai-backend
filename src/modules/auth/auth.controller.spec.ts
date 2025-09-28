import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthenticationService } from './application/services';
import { JwtAuthGuard } from './guards';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OtpRequestDto,
  OtpVerifyDto,
} from './dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthenticationService>;
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: { value: 'test@example.com' },
    firstName: 'Test',
    lastName: 'User',
    role: { value: 'CUSTOMER' },
    phone: { value: '+1234567890' },
    isEmailVerified: true,
    isPhoneVerified: true,
    lastLoginAt: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z'),
  } as any;

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
      getUserProfile: jest.fn(),
      requestOtpChallenge: jest.fn(),
      verifyOtpChallenge: jest.fn(),
      completeRegistrationWithToken: jest.fn(),
      generatePasswordResetOtp: jest.fn(),
      completePasswordReset: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthenticationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        phone: '1234567890',
        countryCode: '+1',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.registerUser.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.registerUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        countryCode: registerDto.countryCode,
        role: registerDto.role,
      });
      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
    });

    it('should complete OTP registration when registrationToken is provided', async () => {
      const registerDto: RegisterDto = {
        registrationToken: 'otp-token',
        firstName: 'Amina',
        lastName: 'Tembo',
        password: 'Password123!',
        role: 'CUSTOMER',
      } as RegisterDto;

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.completeRegistrationWithToken.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.completeRegistrationWithToken).toHaveBeenCalledWith({
        registrationToken: registerDto.registrationToken,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: registerDto.password,
        role: registerDto.role,
      });
      expect(result).toEqual({ success: true, data: expectedResult });
    });

    it('should throw BadRequestException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        phone: '1234567890',
        countryCode: '+1',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
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
      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
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
      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
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
        success: true,
        message: 'Password reset OTP sent',
        requestId: 'req-123',
        expiresAt: new Date(),
      };

      authService.generatePasswordResetOtp.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.generatePasswordResetOtp).toHaveBeenCalledWith({
        email: forgotPasswordDto.email,
        phone: forgotPasswordDto.phone,
        countryCode: forgotPasswordDto.countryCode,
      });
      expect(result).toEqual({
        success: expectedResult.success,
        message: expectedResult.message,
        requestId: expectedResult.requestId,
        expiresAt: expectedResult.expiresAt,
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        otp: 'valid-reset-otp',
        newPassword: 'NewPassword123!',
        requestId: 'req-123',
        email: 'test@example.com',
      };

      const expectedResult = {
        success: true,
        message: 'Password reset successfully',
      };

      authService.completePasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.completePasswordReset).toHaveBeenCalledWith({
        otp: resetPasswordDto.otp,
        newPassword: resetPasswordDto.newPassword,
        requestId: resetPasswordDto.requestId,
        phone: resetPasswordDto.phone,
        email: resetPasswordDto.email,
        countryCode: resetPasswordDto.countryCode,
      });
      expect(result).toEqual({
        success: true,
        message: 'Password reset successfully',
      });
    });

    it('should throw BadRequestException for invalid reset token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        otp: 'invalid-reset-otp',
        newPassword: 'NewPassword123!',
        requestId: 'req-123',
      };

      authService.completePasswordReset.mockRejectedValue(new BadRequestException('Invalid or expired reset token'));

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const logoutDto = {
        userId: mockUser.id,
        refreshToken: 'valid-refresh-token',
        deviceId: 'device-123',
      };

      const expectedResult = {
        success: true,
        message: 'Successfully logged out',
      };

      authService.logoutUser.mockResolvedValue(expectedResult);

      const result = await controller.logout(logoutDto);

      expect(authService.logoutUser).toHaveBeenCalledWith({
        userId: logoutDto.userId,
        refreshToken: logoutDto.refreshToken,
        deviceId: logoutDto.deviceId,
      });
      expect(result).toEqual({
        success: expectedResult.success,
        message: expectedResult.message,
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

      authService.getUserProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getUserProfile).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('requestOtp', () => {
    it('should request an OTP challenge neutrally', async () => {
      const otpRequestDto: OtpRequestDto = {
        phone: '972827372',
        countryCode: '+260',
        purpose: 'login',
      };

      const expectedResult = {
        challengeId: 'challenge-123',
        expiresAt: new Date(),
        resendAvailableAt: new Date(),
        attemptsAllowed: 5,
      };

      (authService.requestOtpChallenge as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.requestOtp(otpRequestDto);

      expect(authService.requestOtpChallenge).toHaveBeenCalledWith({
        purpose: otpRequestDto.purpose,
        email: otpRequestDto.email,
        phone: otpRequestDto.phone,
        countryCode: otpRequestDto.countryCode,
        deviceId: otpRequestDto.deviceId,
        deviceType: otpRequestDto.deviceType,
      });
      expect(result).toEqual({
        success: true,
        data: {
          challengeId: expectedResult.challengeId,
          expiresAt: expectedResult.expiresAt,
          resendAvailableAt: expectedResult.resendAvailableAt,
          attemptsAllowed: expectedResult.attemptsAllowed,
        },
        message: 'If the identifier is registered you will receive an OTP shortly.',
      });
    });
  });

  describe('verifyOtpChallenge', () => {
    it('should return tokens for an existing user', async () => {
      const verifyDto: OtpVerifyDto = {
        challengeId: 'challenge-123',
        otp: '123456',
      };

      const expectedResult = {
        success: true,
        isNewUser: false,
        user: mockUser,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      };

      (authService.verifyOtpChallenge as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verifyOtpChallenge(verifyDto);

      expect(authService.verifyOtpChallenge).toHaveBeenCalledWith({
        challengeId: verifyDto.challengeId,
        otp: verifyDto.otp,
      });
      expect(result).toEqual({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email.value,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role.value,
            phone: mockUser.phone.value,
            isEmailVerified: mockUser.isEmailVerified,
            isPhoneVerified: mockUser.isPhoneVerified,
            lastLoginAt: mockUser.lastLoginAt,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
          tokens: {
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
          },
        },
      });
    });

    it('should return registration token for a new user', async () => {
      const verifyDto: OtpVerifyDto = {
        challengeId: 'challenge-123',
        otp: '123456',
      };

      const expectedResult = {
        success: true,
        isNewUser: true,
        registrationToken: 'otp-token',
      };

      (authService.verifyOtpChallenge as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.verifyOtpChallenge(verifyDto);

      expect(result).toEqual({
        success: true,
        data: { registrationToken: 'otp-token', expiresIn: 600 },
      });
    });
  });

});
