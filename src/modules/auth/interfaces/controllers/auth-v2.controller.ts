import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthServiceV2 } from '../../application/services/auth-v2.service';
import {
  StartOtpDto,
  StartOtpResponseDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
  SelectRoleDto,
  SelectRoleResponseDto,
  CurrentUserResponseDto,
  ErrorResponseDto,
} from '../../application/dtos/auth-v2.dto';
import { Public } from '../../infrastructure/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthV2Controller {
  constructor(private readonly authService: AuthServiceV2) {}

  /**
   * Start OTP flow - initiates login/signup
   * POST /api/v1/auth/otp/start
   */
  @Public()
  @Post('otp/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start OTP authentication flow',
    description:
      'Initiates the OTP-based authentication process for login or signup. ' +
      'Sends an OTP code to the provided email or phone number.',
  })
  @ApiBody({ type: StartOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: StartOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - email or phone required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
    type: ErrorResponseDto,
  })
  async startOtpFlow(
    @Body() dto: StartOtpDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.startOtpFlow(
        dto.email,
        dto.phone,
        dto.deviceId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Verify OTP and get tokens or onboarding token
   * POST /api/v1/auth/otp/verify
   */
  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP code',
    description:
      'Verifies the OTP code sent to user. For new users, returns an onboarding token. ' +
      'For existing users, returns access and refresh tokens.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid session',
    type: ErrorResponseDto,
  })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.verifyOtp(
        dto.sessionId,
        dto.otp,
        dto.deviceId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Select role and get full tokens
   * POST /api/v1/auth/select-role
   */
  @Public()
  @Post('select-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select user role during onboarding',
    description:
      'Completes onboarding by selecting initial role (CUSTOMER, TASKER, or VENDOR). ' +
      'Returns full authentication tokens. Requires onboarding token from OTP verification.',
  })
  @ApiBody({ type: SelectRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role selected successfully',
    type: SelectRoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role or onboarding token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid onboarding token',
    type: ErrorResponseDto,
  })
  async selectRole(
    @Body() dto: SelectRoleDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.selectRole(
        dto.onboardingToken,
        dto.role,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user information',
    description:
      'Returns the currently authenticated user information including role and status. ' +
      'Requires valid JWT token in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: CurrentUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
    type: ErrorResponseDto,
  })
  async getCurrentUser(
    @Headers('authorization') authHeader: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(
          'Missing or invalid authorization header',
        );
      }

      const token = authHeader.substring(7);
      const user = await this.authService.getCurrentUser(token);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const response: CurrentUserResponseDto = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phoneNumber,
            role: user.role,
            status: user.status,
          },
        },
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ==================== Private Methods ====================

  private handleError(error: any, res: Response): void {
    console.error('Auth error:', error);

    if (error instanceof BadRequestException) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
    } else if (error instanceof UnauthorizedException) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
        },
      });
    } else if (error.status === 429) {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message:
            error.message || 'Too many requests. Please try again later.',
        },
      });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}
