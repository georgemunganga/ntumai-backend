import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterOtpDto,
  VerifyOtpDto,
  CompleteRegistrationDto,
  LoginOtpDto,
  LogoutDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse, TokenResponse } from './interfaces';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  LogoutUserUseCase,
  GetUserProfileUseCase,
} from './application/use-cases';
import { AuthenticationService, PasswordManagementService } from './application/services';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly passwordManagementService: PasswordManagementService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'CUSTOMER' },
                phone: { type: 'string', example: '+1234567890' },
                isEmailVerified: { type: 'boolean', example: false },
                isPhoneVerified: { type: 'boolean', example: false },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email or phone already exists',
  })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authenticationService.registerUser({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: registerDto.role,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid' },
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'CUSTOMER' },
                phone: { type: 'string', example: '+1234567890' },
                isEmailVerified: { type: 'boolean', example: false },
                isPhoneVerified: { type: 'boolean', example: false },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authenticationService.loginUser({
      email: loginDto.email,
      password: loginDto.password,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authenticationService.refreshToken({
      refreshToken: refreshTokenDto.refreshToken,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'If the email exists, a reset link has been sent',
            },
          },
        },
      },
    },
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.passwordManagementService.forgotPassword({
      email: forgotPasswordDto.email,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Password has been reset successfully',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    // TODO: Implement OTP-based password reset logic
    const result = await this.passwordManagementService.resetPassword({
      otp: resetPasswordDto.otp,
      newPassword: resetPasswordDto.newPassword,
      requestId: resetPasswordDto.requestId,
      phoneNumber: resetPasswordDto.phoneNumber,
      email: resetPasswordDto.email,
      countryCode: resetPasswordDto.countryCode,
    });
    return {
      success: true,
      data: result,
    };
  }



  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from all devices' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out from all devices',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Logged out from all devices successfully',
            },
          },
        },
      },
    },
  })
  async logoutAll(@Request() req) {
    const result = await this.authenticationService.logoutUser({
      userId: req.user.id,
    });
    return {
      success: true,
      data: {
        message: 'Logged out from all devices successfully',
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'CUSTOMER' },
            phone: { type: 'string', example: '+1234567890' },
            isEmailVerified: { type: 'boolean', example: false },
            isPhoneVerified: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async getProfile(@Request() req) {
    const result = await this.authenticationService.getProfile({
      userId: req.user.id,
    });
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }
    
    return {
      success: true,
      data: result.user,
    };
  }

  // OTP-based Authentication Endpoints
  @Post('register-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register user with OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully' },
        requestId: { type: 'string', example: 'req-123' },
      },
    },
  })
  async registerWithOtp(@Body() registerOtpDto: RegisterOtpDto) {
    // TODO: Implement OTP registration logic
    return {
      success: true,
      message: 'OTP sent successfully',
      requestId: 'temp-request-id',
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        isNewUser: { type: 'boolean', example: true },
        token: { type: 'string', example: 'token-123' },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    // TODO: Implement OTP verification logic
    return {
      success: true,
      isNewUser: true,
      token: 'temp-token',
    };
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete registration after OTP verification' })
  @ApiResponse({
    status: 201,
    description: 'Registration completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        token: { type: 'string', example: 'jwt-token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            name: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            email: { type: 'string', example: 'user@example.com' },
            userType: { type: 'string', example: 'customer' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
          },
        },
      },
    },
  })
  async completeRegistration(@Body() completeRegistrationDto: CompleteRegistrationDto) {
    // TODO: Implement complete registration logic
    return {
      success: true,
      token: 'temp-jwt-token',
      user: {
        id: 'temp-user-id',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'user@example.com',
        userType: 'customer',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Post('login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        tokenid: { type: 'string', example: 'jwt-token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            name: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            email: { type: 'string', example: 'user@example.com' },
            userType: { type: 'string', example: 'customer' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
          },
        },
      },
    },
  })
  async loginWithOtp(@Body() loginOtpDto: LoginOtpDto) {
    // TODO: Implement OTP login logic
    return {
      success: true,
      tokenid: 'temp-jwt-token',
      user: {
        id: 'temp-user-id',
        name: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'user@example.com',
        userType: 'customer',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  async logout(@Body() logoutDto: LogoutDto) {
    // TODO: Implement logout logic
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}