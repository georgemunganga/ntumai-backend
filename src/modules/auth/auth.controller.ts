import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiExtraModels,
  getSchemaPath,
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
// Removed unused individual use case imports - using consolidated application services
import { AuthenticationService, PasswordManagementService } from './application/services';
// Comment out OtpSecurityAdapter import
// import { OtpSecurityAdapter } from './application/services/otp-security.adapter';

@ApiTags('Authentication')
@Controller('auth')
@ApiProduces('application/json')
@ApiConsumes('application/json')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly passwordManagementService: PasswordManagementService,
    // Comment out OtpSecurityAdapter dependency
    // private readonly otpSecurityAdapter: OtpSecurityAdapter,
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user with email/password',
    description: 'Creates a new user account using email and password. Returns user data and authentication tokens upon successful registration.'
  })
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
                id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
                email: { type: 'string', example: 'john.doe@example.com' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', example: 'CUSTOMER', enum: ['CUSTOMER', 'DRIVER', 'VENDOR', 'ADMIN'] },
                phone: { type: 'string', example: '+260972827372' },
                isEmailVerified: { type: 'boolean', example: false },
                isPhoneVerified: { type: 'boolean', example: false },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                expiresIn: { type: 'number', example: 3600, description: 'Token expiration time in seconds' }
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Invalid email format' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email must be a valid email address' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this email or phone already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_ALREADY_EXISTS' },
            message: { type: 'string', example: 'User with this email already exists' }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      customer: {
        summary: 'Customer Registration',
        description: 'Register as a customer',
        value: {
          email: 'customer@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+260972827372',
          role: 'CUSTOMER'
        }
      },
      driver: {
        summary: 'Driver Registration',
        description: 'Register as a driver',
        value: {
          email: 'driver@example.com',
          password: 'SecurePass123!',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+260977123456',
          role: 'DRIVER'
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Login user with email/phone and password',
    description: 'Authenticate user using email or phone number with password. Returns user data and JWT tokens for subsequent API calls.'
  })
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
                id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
                email: { type: 'string', example: 'john.doe@example.com' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', example: 'CUSTOMER', enum: ['CUSTOMER', 'DRIVER', 'VENDOR', 'ADMIN'] },
                phone: { type: 'string', example: '+260972827372' },
                isEmailVerified: { type: 'boolean', example: true },
                isPhoneVerified: { type: 'boolean', example: true },
                lastLoginAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                expiresIn: { type: 'number', example: 3600, description: 'Access token expiration time in seconds' }
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Email or phone number is required' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_CREDENTIALS' },
            message: { type: 'string', example: 'Invalid email/phone or password' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 423,
    description: 'Account Locked - Too many failed login attempts',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'ACCOUNT_LOCKED' },
            message: { type: 'string', example: 'Account temporarily locked due to multiple failed login attempts' },
            retryAfter: { type: 'number', example: 900, description: 'Seconds until account unlock' }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      emailLogin: {
        summary: 'Login with Email',
        description: 'Login using email address and password',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePass123!'
        }
      },
      phoneLogin: {
        summary: 'Login with Phone',
        description: 'Login using phone number and password (E.164 format preferred)',
        value: {
          phoneNumber: '+260972827372',
          password: 'SecurePass123!'
        }
      },
      legacyPhoneLogin: {
        summary: 'Login with Phone (Legacy)',
        description: 'Login using separate phone and country code (deprecated)',
        value: {
          phone: '972827372',
          countryCode: '+260',
          password: 'SecurePass123!'
        }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authenticationService.loginUser({
      email: loginDto.email,
      phone: loginDto.phone,
      countryCode: loginDto.countryCode,
      password: loginDto.password,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token. The refresh token may also be rotated for enhanced security.'
  })
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
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 3600, description: 'Access token expiration time in seconds' },
            tokenType: { type: 'string', example: 'Bearer' }
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REFRESH_TOKEN' },
            message: { type: 'string', example: 'Invalid or expired refresh token' }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: RefreshTokenDto,
    description: 'Refresh token data',
    examples: {
      refreshToken: {
        summary: 'Refresh Access Token',
        description: 'Use refresh token to get new access token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Request password reset',
    description: 'Initiates password reset process by sending OTP to user\'s email or phone number. For security, always returns success regardless of whether user exists.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent if user exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'If the email/phone exists, a reset OTP has been sent' },
        requestId: { type: 'string', example: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p' },
        expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:35:00Z' }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email or phone format',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Valid email or phone number is required' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
            message: { type: 'string', example: 'Too many password reset requests. Please try again later.' },
            retryAfter: { type: 'number', example: 300 }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    description: 'Password reset request data',
    examples: {
      emailReset: {
        summary: 'Reset with Email',
        description: 'Request password reset using email address',
        value: {
          email: 'john.doe@example.com'
        }
      },
      phoneReset: {
        summary: 'Reset with Phone',
        description: 'Request password reset using phone number (E.164 format preferred)',
        value: {
          phoneNumber: '+260972827372'
        }
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authenticationService.generatePasswordResetOtp({
      email: forgotPasswordDto.email,
      phoneNumber: forgotPasswordDto.phoneNumber,
      countryCode: forgotPasswordDto.countryCode,
    });

    return {
      success: result.success,
      message: result.message,
      requestId: result.requestId,
      expiresAt: result.expiresAt,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset password with OTP',
    description: 'Completes password reset process using OTP received via email or SMS. Requires valid OTP and request ID from forgot-password endpoint.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password has been reset successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
            resetAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP or request data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_OTP' },
            message: { type: 'string', example: 'Invalid or expired OTP' },
            attemptsRemaining: { type: 'number', example: 2 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Invalid request ID',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REQUEST_ID' },
            message: { type: 'string', example: 'Invalid or expired password reset request' }
          }
        }
      }
    }
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    description: 'Password reset completion data',
    examples: {
      emailReset: {
        summary: 'Complete Email Reset',
        description: 'Reset password using OTP sent to email',
        value: {
          email: 'john.doe@example.com',
          otp: '123456',
          newPassword: 'NewSecurePass123!',
          requestId: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p'
        }
      },
      phoneReset: {
        summary: 'Complete Phone Reset',
        description: 'Reset password using OTP sent to phone (E.164 format preferred)',
        value: {
          phoneNumber: '+260972827372',
          otp: '654321',
          newPassword: 'NewSecurePass456!',
          requestId: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p'
        }
      }
    }
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authenticationService.completePasswordReset({
      otp: resetPasswordDto.otp,
      requestId: resetPasswordDto.requestId,
      newPassword: resetPasswordDto.newPassword,
      phoneNumber: resetPasswordDto.phoneNumber,
      email: resetPasswordDto.email,
      countryCode: resetPasswordDto.countryCode,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }



  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout user from all devices',
    description: 'Invalidates all refresh tokens for the authenticated user across all devices and sessions. Requires valid JWT access token.'
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out from all devices',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out from all devices successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
            sessionsTerminated: { type: 'number', example: 3, description: 'Number of active sessions terminated' },
            logoutAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Invalid or expired access token' }
          }
        }
      }
    }
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieves the authenticated user\'s profile information including personal details, verification status, and account metadata.'
  })
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
            id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
            email: { type: 'string', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+260972827372' },
            role: { type: 'string', example: 'CUSTOMER', enum: ['CUSTOMER', 'DRIVER', 'VENDOR', 'ADMIN'] },
            isEmailVerified: { type: 'boolean', example: true },
            isPhoneVerified: { type: 'boolean', example: true },
            profileComplete: { type: 'boolean', example: true },
            lastLoginAt: { type: 'string', format: 'date-time', example: '2024-01-15T09:30:00Z' },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-10T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            preferences: {
              type: 'object',
              properties: {
                language: { type: 'string', example: 'en' },
                currency: { type: 'string', example: 'ZMW' },
                notifications: { type: 'boolean', example: true }
              }
            }
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Invalid or expired access token' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User profile not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_NOT_FOUND' },
            message: { type: 'string', example: 'User profile not found' }
          }
        }
      }
    }
  })
  async getProfile(@Request() req) {
    const result = await this.authenticationService.getUserProfile({
      userId: req.user.id,
    });
    
    if (!result.success) {
      throw new UnauthorizedException(result.error || 'Failed to get user profile');
    }
    
    return {
      success: true,
      data: result.user,
    };
  }

  // OTP-based Authentication Endpoints
  @Post('register-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Initiate OTP-based user registration',
    description: 'Start the registration process by sending an OTP to the provided phone number or email. This is the first step in passwordless registration.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully to phone/email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully to +260972827372' },
        requestId: { type: 'string', example: 'otp_req_clh7x9k2l0000qh8v4g2m1n3p' },
        expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:35:00Z' },
        resendAfter: { type: 'number', example: 60, description: 'Seconds before OTP can be resent' }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid phone number or email format',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_PHONE_NUMBER' },
            message: { type: 'string', example: 'Phone number must include country code (start with +)' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists with this phone/email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_ALREADY_EXISTS' },
            message: { type: 'string', example: 'User already exists with this phone number' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - OTP rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'RATE_LIMIT_EXCEEDED' },
            message: { type: 'string', example: 'Too many OTP requests. Please try again later.' },
            retryAfter: { type: 'number', example: 300, description: 'Seconds until next OTP can be requested' }
          }
        }
      }
    }
  })
  @ApiBody({
    type: RegisterOtpDto,
    description: 'OTP registration request data',
    examples: {
      phoneRegistration: {
        summary: 'Register with Phone Number',
        description: 'Start registration using phone number (E.164 format preferred)',
        value: {
          phoneNumber: '+260972827372',
          deviceId: 'device_android_123456',
          deviceType: 'mobile'
        }
      },
      emailRegistration: {
        summary: 'Register with Email',
        description: 'Start registration using email address',
        value: {
          email: 'john.doe@example.com',
          countryCode: 'ZM',
          deviceId: 'device_web_789012',
          deviceType: 'web'
        }
      }
    }
  })
  async registerWithOtp(@Body() registerOtpDto: RegisterOtpDto) {
    const result = await this.authenticationService.registerOtp(registerOtpDto);

    return {
      success: result.success || true,
      message: result.message || 'OTP sent successfully',
      requestId: result.requestId || 'req-123',
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify OTP code',
    description: 'Verify the OTP code sent to phone/email. Returns verification status and temporary token for new users to complete registration.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP verified successfully' },
        isNewUser: { type: 'boolean', example: true, description: 'True if this is a new user registration' },
        verified: { type: 'boolean', example: true },
        token: { type: 'string', example: 'temp_token_clh7x9k2l0000qh8v4g2m1n3p', description: 'Temporary token for completing registration (new users only)' },
        user: {
          type: 'object',
          description: 'User data (existing users only)',
          properties: {
            id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
            email: { type: 'string', example: 'john.doe@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'CUSTOMER' }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP or request data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_OTP' },
            message: { type: 'string', example: 'Invalid OTP code' },
            attemptsRemaining: { type: 'number', example: 2, description: 'Number of verification attempts remaining' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 410,
    description: 'Gone - OTP has expired',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'OTP_EXPIRED' },
            message: { type: 'string', example: 'OTP has expired. Please request a new one.' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 423,
    description: 'Locked - Too many failed verification attempts',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'OTP_ATTEMPTS_EXCEEDED' },
            message: { type: 'string', example: 'Too many failed attempts. Please request a new OTP.' },
            retryAfter: { type: 'number', example: 300, description: 'Seconds until new OTP can be requested' }
          }
        }
      }
    }
  })
  @ApiBody({
    type: VerifyOtpDto,
    description: 'OTP verification data',
    examples: {
      phoneVerification: {
        summary: 'Verify Phone OTP',
        description: 'Verify OTP sent to phone number',
        value: {
          phoneNumber: '+260972827372',
          otp: '123456',
          requestId: 'otp_req_clh7x9k2l0000qh8v4g2m1n3p'
        }
      },
      emailVerification: {
        summary: 'Verify Email OTP',
        description: 'Verify OTP sent to email address',
        value: {
          email: 'john.doe@example.com',
          otp: '654321',
          requestId: 'otp_req_clh7x9k2l0000qh8v4g2m1n3p'
        }
      }
    }
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authenticationService.verifyOtp(verifyOtpDto);

    return {
      success: result.success || true,
      message: result.message || 'OTP verified successfully',
      verified: result.isValid !== undefined ? result.isValid : true,
    };
  }

  @Post('complete-registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Complete user registration after OTP verification',
    description: 'Completes the registration process by providing additional user details after successful OTP verification. Creates the user account and returns authentication tokens.'
  })
  @ApiResponse({
    status: 201,
    description: 'Registration completed successfully',
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
                id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john.doe@example.com' },
                phone: { type: 'string', example: '+260972827372' },
                role: { type: 'string', example: 'CUSTOMER' },
                isEmailVerified: { type: 'boolean', example: true },
                isPhoneVerified: { type: 'boolean', example: true },
                profileComplete: { type: 'boolean', example: true },
                createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                expiresIn: { type: 'number', example: 3600 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid registration data or token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_TOKEN' },
            message: { type: 'string', example: 'Invalid or expired registration token' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_ALREADY_EXISTS' },
            message: { type: 'string', example: 'User with this email or phone already exists' }
          }
        }
      }
    }
  })
  @ApiBody({
    type: CompleteRegistrationDto,
    description: 'Complete registration data with user details and verification token',
    examples: {
      customerRegistration: {
        summary: 'Complete Customer Registration',
        description: 'Complete registration for a customer account',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'SecurePassword123!',
          userType: 'CUSTOMER',
          acceptTerms: true
        }
      },
      driverRegistration: {
        summary: 'Complete Driver Registration',
        description: 'Complete registration for a driver account',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.driver@example.com',
          password: 'DriverPass456!',
          userType: 'DRIVER',
          licenseNumber: 'DL123456789',
          vehicleType: 'motorcycle',
          acceptTerms: true
        }
      },
      vendorRegistration: {
        summary: 'Complete Vendor Registration',
        description: 'Complete registration for a vendor account',
        value: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.vendor@example.com',
          password: 'VendorPass789!',
          userType: 'VENDOR',
          businessName: 'Sarah\'s Kitchen',
          businessType: 'restaurant',
          acceptTerms: true
        }
      }
    }
  })
  async completeRegistration(@Body() completeRegistrationDto: CompleteRegistrationDto) {
    const result = await this.authenticationService.completeRegistration(completeRegistrationDto);

    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    };
  }

  @Post('login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Passwordless login with OTP',
    description: 'Login using OTP verification. If no OTP is provided, sends OTP to phone/email. If OTP is provided, completes the login process.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully (when no OTP provided) or Login successful (when OTP provided)',
    schema: {
      oneOf: [
        {
          title: 'OTP Sent Response',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'OTP sent successfully to +260972827372' },
            requestId: { type: 'string', example: 'login_otp_clh7x9k2l0000qh8v4g2m1n3p' },
            expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:35:00Z' }
          }
        },
        {
          title: 'Login Success Response',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
                    firstName: { type: 'string', example: 'John' },
                    lastName: { type: 'string', example: 'Doe' },
                    email: { type: 'string', example: 'john.doe@example.com' },
                    phone: { type: 'string', example: '+260972827372' },
                    role: { type: 'string', example: 'CUSTOMER' },
                    isEmailVerified: { type: 'boolean', example: true },
                    isPhoneVerified: { type: 'boolean', example: true },
                    lastLoginAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
                  }
                },
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                expiresIn: { type: 'number', example: 3600 }
              }
            }
          }
        }
      ]
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid phone/email or OTP',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_OTP' },
            message: { type: 'string', example: 'Invalid OTP code' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found with provided phone/email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_NOT_FOUND' },
            message: { type: 'string', example: 'User not found with this email or phone number' }
          }
        }
      }
    }
  })
  @ApiBody({
    type: LoginOtpDto,
    description: 'OTP login data - omit OTP to request new OTP, include OTP to complete login',
    examples: {
      requestOtp: {
        summary: 'Request OTP for Login',
        description: 'Send OTP to phone number for login',
        value: {
          phoneNumber: '+260972827372',
          deviceId: 'device_android_123456',
          deviceType: 'mobile'
        }
      },
      completeLogin: {
        summary: 'Complete Login with OTP',
        description: 'Complete login using received OTP',
        value: {
          phoneNumber: '+260972827372',
          otp: '123456',
          deviceId: 'device_android_123456',
          deviceType: 'mobile'
        }
      },
      emailLogin: {
        summary: 'Email OTP Login',
        description: 'Login using email with OTP',
        value: {
          email: 'john.doe@example.com',
          otp: '654321'
        }
      }
    }
  })
  async loginWithOtp(@Body() loginOtpDto: LoginOtpDto) {
    // If no OTP provided, generate and send OTP
    if (!loginOtpDto.otp) {
      const result = await this.authenticationService.loginOtp(loginOtpDto);
      return result;
    }

    // If OTP provided, complete login
    const result = await this.authenticationService.completeLogin({
      otp: loginOtpDto.otp!,
      phoneNumber: loginOtpDto.phoneNumber,
      email: loginOtpDto.email,
      countryCode: loginOtpDto.countryCode,
      deviceId: loginOtpDto.deviceId,
      deviceType: loginOtpDto.deviceType,
    });
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Logout user from current session',
    description: 'Logs out user from the current session by invalidating the provided refresh token. Access token will remain valid until expiration.'
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'clh7x9k2l0000qh8v4g2m1n3p' },
            logoutAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid logout data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REQUEST' },
            message: { type: 'string', example: 'User ID and refresh token are required' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REFRESH_TOKEN' },
            message: { type: 'string', example: 'Invalid or expired refresh token' }
          }
        }
      }
    }
  })
  @ApiBody({
    type: LogoutDto,
    description: 'Logout request data',
    examples: {
      logout: {
        summary: 'Logout from Current Session',
        description: 'Logout user from current session using refresh token',
        value: {
          userId: 'clh7x9k2l0000qh8v4g2m1n3p',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  async logout(@Body() logoutDto: LogoutDto) {
    const result = await this.authenticationService.logoutUser({
      userId: logoutDto.userId,
      refreshToken: logoutDto.refreshToken,
    });
    return {
      success: result.success,
      message: result.message,
    };
  }
}