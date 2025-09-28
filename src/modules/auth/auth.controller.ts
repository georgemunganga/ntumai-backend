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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  OtpRequestDto,
  OtpVerifyDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticationService } from './application/services';
import { User } from './domain/entities';

@ApiTags('Authentication')
@Controller('auth')
@ApiProduces('application/json')
@ApiConsumes('application/json')
export class AuthController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using email/password or completes OTP-based signup when a registration token is provided.'
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
    description: 'User registration payload or OTP completion data',
    examples: {
      customer: {
        summary: 'Customer Registration',
        description: 'Register as a customer',
        value: {
          email: 'customer@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
          phone: '972827372',
          countryCode: '+260',
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
          phone: '977123456',
          countryCode: '+260',
          role: 'DRIVER'
        }
      },
      otpCompletion: {
        summary: 'Complete OTP registration',
        description: 'Finalize registration using the registration token returned by /auth/otp/verify',
        value: {
          registrationToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          firstName: 'Amina',
          lastName: 'Tembo',
          password: 'SecurePass123!',
          role: 'CUSTOMER'
        }
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    if (registerDto.registrationToken) {
      const result = await this.authenticationService.completeRegistrationWithToken({
        registrationToken: registerDto.registrationToken,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: registerDto.password,
        role: registerDto.role,
      });

      return {
        success: true,
        data: result,
      };
    }

    if (!registerDto.email || !registerDto.password || !registerDto.phone || !registerDto.countryCode) {
      throw new BadRequestException('Email, password, phone, and country code are required for direct registration');
    }

    const result = await this.authenticationService.registerUser({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      countryCode: registerDto.countryCode,
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
        description: 'Login using phone number and password (submit national number and country code separately)',
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
        description: 'Request password reset using phone number (submit national number and country code separately)',
        value: {
          phone: '972827372',
          countryCode: '+260'
        }
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authenticationService.generatePasswordResetOtp({
      email: forgotPasswordDto.email,
      phone: forgotPasswordDto.phone,
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
        description: 'Reset password using OTP sent to phone (submit national number and country code separately)',
        value: {
          phone: '972827372',
          countryCode: '+260',
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
      phone: resetPasswordDto.phone,
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
  @Post('otp/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request an OTP challenge',
    description:
      'Issues a neutral OTP challenge for login or registration without disclosing whether the identifier exists. Submit either email or a split phone (phone + countryCode).'
  })
  @ApiResponse({
    status: 202,
    description: 'OTP challenge issued',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            challengeId: { type: 'string', example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e' },
            expiresAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:35:00Z' },
            resendAvailableAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:32:00Z' },
            attemptsAllowed: { type: 'number', example: 5 }
          }
        },
        message: { type: 'string', example: 'If the identifier is registered you will receive an OTP shortly.' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - request is missing a valid identifier or purpose',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests for the same identifier or device',
  })
  @ApiBody({
    type: OtpRequestDto,
    description: 'Identifier and purpose for the OTP challenge',
    examples: {
      phoneLogin: {
        summary: 'Login via phone',
        value: {
          phone: '972827372',
          countryCode: '+260',
          purpose: 'login'
        }
      },
      emailRegister: {
        summary: 'Register via email',
        value: {
          email: 'new.user@example.com',
          purpose: 'register'
        }
      }
    }
  })
  async requestOtp(@Body() otpRequestDto: OtpRequestDto) {
    const result = await this.authenticationService.requestOtpChallenge({
      purpose: otpRequestDto.purpose,
      email: otpRequestDto.email,
      phone: otpRequestDto.phone,
      countryCode: otpRequestDto.countryCode,
      deviceId: otpRequestDto.deviceId,
      deviceType: otpRequestDto.deviceType,
    });

    return {
      success: true,
      data: {
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
        attemptsAllowed: result.attemptsAllowed,
      },
      message: 'If the identifier is registered you will receive an OTP shortly.',
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify an OTP challenge',
    description: 'Validates the OTP code. Existing users receive tokens, while new users receive a temporary registration token.'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified',
    schema: {
      oneOf: [
        {
          title: 'Existing user',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        {
          title: 'New user',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                registrationToken: { type: 'string' },
                expiresIn: { type: 'number', example: 600 }
              }
            }
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 401, description: 'Registration token expired for new user flow' })
  @ApiResponse({ status: 423, description: 'Challenge locked after too many attempts' })
  @ApiBody({
    type: OtpVerifyDto,
    description: 'Challenge identifier and OTP code',
    examples: {
      loginCompletion: {
        summary: 'Verify OTP for login',
        description: 'Existing user completes login challenge and receives JWT tokens',
        value: {
          challengeId: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e',
          otp: '123456',
        },
      },
      registrationContinuation: {
        summary: 'Verify OTP for new user registration',
        description: 'New user validates challenge and receives a temporary registration token',
        value: {
          challengeId: 'af3c6714-908d-4f36-9f5d-9ef1e5ed2f1b',
          otp: '654321',
        },
      },
    },
  })
  async verifyOtpChallenge(@Body() verifyDto: OtpVerifyDto) {
    const result = await this.authenticationService.verifyOtpChallenge({
      challengeId: verifyDto.challengeId,
      otp: verifyDto.otp,
    });

    if (result.isNewUser) {
      return {
        success: true,
        data: {
          registrationToken: result.registrationToken,
          expiresIn: 600,
        },
      };
    }

    return {
      success: true,
      data: {
        user: this.mapUserResponse(result.user as User),
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
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

  private mapUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.value,
      phone: user.phone ? user.phone.value : null,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}