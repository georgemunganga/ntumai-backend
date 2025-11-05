import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import { Public } from '../../../shared/common/decorators/public.decorator';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard';
import { OtpRequestDto } from '../../application/dtos/request/otp-request.dto';
import { OtpVerifyDto } from '../../application/dtos/request/otp-verify.dto';
import { RegisterDto } from '../../application/dtos/request/register.dto';
import { RefreshTokenDto } from '../../application/dtos/request/refresh-token.dto';
import { LogoutDto } from '../../application/dtos/request/logout.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../../application/dtos/request/forgot-password.dto';
import {
  OtpRequestResponseDto,
  UserResponseDto,
  TokensResponseDto,
  RegisterResponseDto,
} from '../../application/dtos/response/user-response.dto';
import { AuthService } from '../../application/services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request OTP',
    description:
      'Request a neutral OTP challenge (works for both login & registration). Response is identical regardless of whether the identifier exists.',
  })
  @ApiAcceptedResponse({
    description: 'OTP challenge created',
    type: OtpRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async requestOtp(
    @Body() dto: OtpRequestDto,
    @Req() req: any,
  ): Promise<OtpRequestResponseDto> {
    return this.authService.requestOtp(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description:
      'Validate the OTP. If the identifier already belongs to a user, return credentials. Otherwise, issue a short-lived registrationToken to complete signup.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified - existing user (login complete)',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 'clh7x9k2l0000qh8v4g2m1n3p',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'CUSTOMER',
            phone: '+260972827372',
            isEmailVerified: true,
            isPhoneVerified: true,
          },
          tokens: {
            accessToken: '<jwt>',
            refreshToken: '<jwt>',
            expiresIn: 3600,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified - new user (continue to registration)',
    schema: {
      example: {
        success: true,
        data: {
          registrationToken: '<short-lived-jwt>',
          expiresIn: 600,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid/expired challenge or OTP' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async verifyOtp(@Body() dto: OtpVerifyDto): Promise<any> {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete registration',
    description:
      'Complete signup after OTP verification using the registrationToken, or perform traditional email/phone signup.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or token expired' })
  @ApiResponse({ status: 409, description: 'Email/phone already registered' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchange a refresh token for a new token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<TokensResponseDto> {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout from device',
    description:
      'Invalidate a specific refresh token (optionally scoped by device).',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  async logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    return this.authService.logout(dto);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all refresh tokens for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Logged out from all devices successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@Req() req: any): Promise<{ message: string }> {
    return this.authService.logoutAll(req.user.userId);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Return the currently authenticated user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any): Promise<UserResponseDto> {
    return this.authService.getProfile(req.user.userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Request a password reset OTP via email or SMS. Always returns 200 to prevent account enumeration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent (if account exists)',
    schema: {
      example: {
        success: true,
        message: 'If the email/phone exists, a reset OTP has been sent',
        requestId: 'pwd_reset_clh7x9k2l0000qh8v4g2m1n3p',
        expiresAt: '2025-01-15T10:35:00Z',
      },
    },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: any,
  ): Promise<any> {
    return this.authService.forgotPassword(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Complete a password reset using the OTP + new password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        success: true,
        message: 'Password has been reset successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP or request' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
