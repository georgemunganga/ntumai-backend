import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthenticationService, PasswordManagementService } from './application/services';
import { OtpSecurityAdapter } from './application/services/otp-security.adapter';
import { JwtAuthGuard } from './guards';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, RegisterOtpDto, VerifyOtpDto, CompleteRegistrationDto, LoginOtpDto } from './dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthenticationService>;
  let passwordService: jest.Mocked<PasswordManagementService>;
  let otpService: jest.Mocked<OtpSecurityAdapter>;

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
      getUserProfile: jest.fn(),
      registerOtp: jest.fn(),
      verifyOtp: jest.fn(),
      completeRegistration: jest.fn(),
      loginOtp: jest.fn(),
    };

    const mockPasswordService = {
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const mockOtpService = {
      generateOtp: jest.fn(),
      verifyOtp: jest.fn(),
      sendOtp: jest.fn(),
      generateLoginOtp: jest.fn(),
      generatePasswordResetOtp: jest.fn(),
      completePasswordReset: jest.fn(),
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
        {
          provide: OtpSecurityAdapter,
          useValue: mockOtpService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthenticationService);
    passwordService = module.get(PasswordManagementService);
    otpService = module.get(OtpSecurityAdapter);
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
        role: registerDto.role,
      });
      expect(result).toEqual({
        success: true,
        data: expectedResult,
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
      };

      otpService.generatePasswordResetOtp.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(otpService.generatePasswordResetOtp).toHaveBeenCalledWith({
        email: forgotPasswordDto.email,
        phoneNumber: forgotPasswordDto.phoneNumber,
        countryCode: forgotPasswordDto.countryCode,
      });
      expect(result).toEqual({
        success: expectedResult.success,
        message: expectedResult.message,
        requestId: expectedResult.requestId,
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

      otpService.completePasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(otpService.completePasswordReset).toHaveBeenCalledWith({
        otp: resetPasswordDto.otp,
        newPassword: resetPasswordDto.newPassword,
        requestId: resetPasswordDto.requestId,
        phoneNumber: resetPasswordDto.phoneNumber,
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

      otpService.completePasswordReset.mockRejectedValue(new BadRequestException('Invalid or expired reset token'));

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

  describe('registerWithOtp', () => {
    it('should initiate OTP registration successfully', async () => {
      const registerOtpDto: RegisterOtpDto = {
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        countryCode: 'US',
        deviceId: 'device-123',
        deviceType: 'mobile',
      };

      const expectedResult = {
        success: true,
        requestId: 'req-123',
        message: 'OTP sent successfully',
      };

      authService.registerOtp.mockResolvedValue(expectedResult);

      const result = await controller.registerWithOtp(registerOtpDto);

      expect(authService.registerOtp).toHaveBeenCalledWith(registerOtpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when user already exists', async () => {
      const registerOtpDto: RegisterOtpDto = {
        phoneNumber: '+1234567890',
        email: 'existing@example.com',
        countryCode: 'US',
      };

      authService.registerOtp.mockRejectedValue(new BadRequestException('User already exists'));

      await expect(controller.registerWithOtp(registerOtpDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        otp: '123456',
        requestId: 'req-123',
      };

      const expectedResult = {
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      };

      authService.verifyOtp.mockResolvedValue(expectedResult);

      const result = await controller.verifyOtp(verifyOtpDto);

      expect(authService.verifyOtp).toHaveBeenCalledWith(verifyOtpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '+1234567890',
        otp: '000000',
        requestId: 'req-123',
      };

      authService.verifyOtp.mockRejectedValue(new BadRequestException('Invalid OTP'));

      await expect(controller.verifyOtp(verifyOtpDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired OTP', async () => {
      const verifyOtpDto: VerifyOtpDto = {
        phoneNumber: '+1234567890',
        otp: '123456',
        requestId: 'req-123',
      };

      authService.verifyOtp.mockRejectedValue(new BadRequestException('OTP expired'));

      await expect(controller.verifyOtp(verifyOtpDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      const completeRegistrationDto: CompleteRegistrationDto = {
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        otp: '123456',
        requestId: 'req-123',
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.completeRegistration.mockResolvedValue(expectedResult);

      const result = await controller.completeRegistration(completeRegistrationDto);

      expect(authService.completeRegistration).toHaveBeenCalledWith(completeRegistrationDto);
      expect(result).toEqual({
        success: true,
        data: {
          user: expectedResult.user,
          accessToken: expectedResult.tokens.accessToken,
          refreshToken: expectedResult.tokens.refreshToken,
        },
      });
    });

    it('should throw BadRequestException for invalid OTP during registration', async () => {
      const completeRegistrationDto: CompleteRegistrationDto = {
        phoneNumber: '+1234567890',
        otp: '000000',
        requestId: 'req-123',
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123!',
      };

      authService.completeRegistration.mockRejectedValue(new BadRequestException('Invalid OTP'));

      await expect(controller.completeRegistration(completeRegistrationDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('loginWithOtp', () => {
    it('should initiate OTP login successfully when no OTP provided', async () => {
      const loginOtpDto: LoginOtpDto = {
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        deviceId: 'device-123',
        deviceType: 'mobile',
      };

      const expectedResult = {
        success: true,
        requestId: 'req-123',
        message: 'OTP sent successfully',
      };

      authService.loginOtp.mockResolvedValue(expectedResult);

      const result = await controller.loginWithOtp(loginOtpDto);

      expect(authService.loginOtp).toHaveBeenCalledWith(loginOtpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should complete login successfully when OTP provided', async () => {
      const loginOtpDto: LoginOtpDto = {
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        otp: '123456',
        deviceId: 'device-123',
        deviceType: 'mobile',
      };

      const expectedResult = {
        user: mockUser,
        tokens: mockTokens,
      };

      authService.loginOtp.mockResolvedValue(expectedResult);

      const result = await controller.loginWithOtp(loginOtpDto);

      expect(authService.loginOtp).toHaveBeenCalledWith(loginOtpDto);
      expect(result).toEqual({
        success: true,
        data: {
          user: expectedResult.user,
          accessToken: expectedResult.tokens.accessToken,
          refreshToken: expectedResult.tokens.refreshToken,
        },
      });
    });

    it('should throw UnauthorizedException for invalid OTP during login', async () => {
      const loginOtpDto: LoginOtpDto = {
        phoneNumber: '+1234567890',
        otp: '000000',
      };

      authService.loginOtp.mockRejectedValue(new UnauthorizedException('Invalid OTP'));

      await expect(controller.loginWithOtp(loginOtpDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginOtpDto: LoginOtpDto = {
        phoneNumber: '+9999999999',
      };

      authService.loginOtp.mockRejectedValue(new UnauthorizedException('User not found'));

      await expect(controller.loginWithOtp(loginOtpDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});