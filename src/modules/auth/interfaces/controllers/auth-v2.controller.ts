import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  Res,
  UseGuards,
  Req,
  Param,
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
  RefreshTokenDto,
  RefreshTokenResponseDto,
  LogoutDto,
  ErrorResponseDto,
  ActivateRoleDto,
  ActivateRoleResponseDto,
  CompleteRoleOnboardingResponseDto,
  CompleteTaskerOnboardingDto,
  CompleteVendorOnboardingDto,
  KycStatusResponseDto,
  KycSubmissionListResponseDto,
  OnboardingDraftResponseDto,
  ProfileAddressesResponseDto,
  ReviewKycSubmissionDto,
  SaveOnboardingDraftDto,
  UpsertKycDocumentDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '../../application/dtos/auth-v2.dto';
import { Public } from '../../infrastructure/decorators/public.decorator';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard';

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
        dto.requestedRole,
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
            phone: user.phone,
            role: user.role,
            activeRole: user.activeRole,
            roles: user.roles,
            roleStatuses: user.roleStatuses,
            status: user.status || 'active',
          },
        },
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get saved addresses for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: ProfileAddressesResponseDto,
  })
  async getAddresses(@Req() req: any, @Res() res: Response): Promise<void> {
    try {
      const response = await this.authService.getAddresses(req.user.userId);
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a saved address for the authenticated user',
  })
  async createAddress(
    @Req() req: any,
    @Body() dto: CreateAddressDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.createAddress(req.user.userId, dto);
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Patch('me/addresses/:addressId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a saved address for the authenticated user',
  })
  async updateAddress(
    @Req() req: any,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.updateAddress(
        req.user.userId,
        addressId,
        dto,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Patch('me/addresses/:addressId/default')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Set a saved address as the default address',
  })
  async setDefaultAddress(
    @Req() req: any,
    @Param('addressId') addressId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.setDefaultAddress(
        req.user.userId,
        addressId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Delete('me/addresses/:addressId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a saved address for the authenticated user',
  })
  async deleteAddress(
    @Req() req: any,
    @Param('addressId') addressId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.deleteAddress(
        req.user.userId,
        addressId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('roles/activate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add or activate a user role',
    description:
      'Adds the requested role for the authenticated user if missing, makes it the active role, and returns fresh tokens.',
  })
  @ApiBody({ type: ActivateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role activated successfully',
    type: ActivateRoleResponseDto,
  })
  async activateRole(
    @Headers('authorization') authHeader: string,
    @Body() dto: ActivateRoleDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException(
          'Missing or invalid authorization header',
        );
      }

      const token = authHeader.substring(7);
      const response = await this.authService.activateRole(token, dto.role);
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('me/onboarding/vendor/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Complete vendor onboarding',
    description:
      'Persists the authenticated vendor onboarding submission and marks vendor onboarding as complete.',
  })
  @ApiBody({ type: CompleteVendorOnboardingDto })
  @ApiResponse({
    status: 200,
    description: 'Vendor onboarding completed successfully',
    type: CompleteRoleOnboardingResponseDto,
  })
  async completeVendorOnboarding(
    @Req() req: any,
    @Body() dto: CompleteVendorOnboardingDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.completeVendorOnboarding(
        req.user.userId,
        dto,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('me/onboarding/tasker/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Complete tasker onboarding',
    description:
      'Persists the authenticated tasker onboarding submission and marks tasker onboarding as complete.',
  })
  @ApiBody({ type: CompleteTaskerOnboardingDto })
  @ApiResponse({
    status: 200,
    description: 'Tasker onboarding completed successfully',
    type: CompleteRoleOnboardingResponseDto,
  })
  async completeTaskerOnboarding(
    @Req() req: any,
    @Body() dto: CompleteTaskerOnboardingDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.completeTaskerOnboarding(
        req.user.userId,
        dto,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Get('me/onboarding/:role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get onboarding draft and status for the authenticated role',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding draft retrieved successfully',
    type: OnboardingDraftResponseDto,
  })
  async getOnboardingDraft(
    @Req() req: any,
    @Param('role') role: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported onboarding role');
      }

      const response = await this.authService.getOnboardingDraft(
        req.user.userId,
        role,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Put('me/onboarding/:role/draft')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Save onboarding draft for the authenticated role',
  })
  @ApiBody({ type: SaveOnboardingDraftDto })
  @ApiResponse({
    status: 200,
    description: 'Onboarding draft saved successfully',
    type: OnboardingDraftResponseDto,
  })
  async saveOnboardingDraft(
    @Req() req: any,
    @Param('role') role: string,
    @Body() dto: SaveOnboardingDraftDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported onboarding role');
      }

      const response = await this.authService.saveOnboardingDraft(
        req.user.userId,
        role,
        dto.currentStepId,
        dto.draftData,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Get('me/kyc/:role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get KYC status for the authenticated role',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC status retrieved successfully',
    type: KycStatusResponseDto,
  })
  async getKycStatus(
    @Req() req: any,
    @Param('role') role: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported KYC role');
      }

      const response = await this.authService.getKycStatus(
        req.user.userId,
        role,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Put('me/kyc/:role/documents')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create or update a KYC document for the authenticated role',
  })
  @ApiBody({ type: UpsertKycDocumentDto })
  @ApiResponse({
    status: 200,
    description: 'KYC document saved successfully',
    type: KycStatusResponseDto,
  })
  async upsertKycDocument(
    @Req() req: any,
    @Param('role') role: string,
    @Body() dto: UpsertKycDocumentDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported KYC role');
      }

      const response = await this.authService.upsertKycDocument(
        req.user.userId,
        role,
        dto,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Delete('me/kyc/:role/documents/:documentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a KYC document for the authenticated role',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC document deleted successfully',
    type: KycStatusResponseDto,
  })
  async deleteKycDocument(
    @Req() req: any,
    @Param('role') role: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported KYC role');
      }

      const response = await this.authService.deleteKycDocument(
        req.user.userId,
        role,
        documentId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('me/kyc/:role/submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Submit KYC for review',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC submitted successfully',
    type: KycStatusResponseDto,
  })
  async submitKyc(
    @Req() req: any,
    @Param('role') role: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported KYC role');
      }

      const response = await this.authService.submitKyc(req.user.userId, role);
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Get('admin/kyc/submissions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List KYC submissions for admin review',
  })
  @ApiResponse({
    status: 200,
    description: 'KYC submissions retrieved successfully',
    type: KycSubmissionListResponseDto,
  })
  async listKycSubmissions(
    @Req() req: any,
    @Headers('x-kyc-role') role: string | undefined,
    @Headers('x-kyc-status') status: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.listKycSubmissions(
        req.user.userId,
        {
          role: role === 'vendor' || role === 'tasker' ? role : undefined,
          status: status as any,
        },
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  @Post('admin/kyc/:userId/:role/review')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Approve, reject, or request changes for a KYC submission',
  })
  @ApiBody({ type: ReviewKycSubmissionDto })
  @ApiResponse({
    status: 200,
    description: 'KYC review saved successfully',
    type: KycStatusResponseDto,
  })
  async reviewKycSubmission(
    @Req() req: any,
    @Param('userId') userId: string,
    @Param('role') role: string,
    @Body() dto: ReviewKycSubmissionDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (role !== 'vendor' && role !== 'tasker') {
        throw new BadRequestException('Unsupported KYC role');
      }

      const response = await this.authService.reviewKycSubmission(
        req.user.userId,
        userId,
        role,
        dto,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Rotates a valid refresh token and returns a new token pair.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.authService.refreshAccessToken(
        dto.refreshToken,
        dto.deviceId,
      );
      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes the provided refresh token. Can revoke all devices when requested.',
  })
  @ApiBody({ type: LogoutDto })
  async logout(@Body() dto: LogoutDto, @Res() res: Response): Promise<void> {
    try {
      const response = await this.authService.logout(
        dto.refreshToken,
        Boolean(dto.allDevices),
      );
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
    } else if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const message =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? (response as { message?: string | string[] }).message
          : error.message;

      res.status(status).json({
        success: false,
        error: {
          code: HttpStatus[status] || 'HTTP_ERROR',
          message: Array.isArray(message) ? message.join(', ') : message,
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
