import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { Public } from 'src/modules/auth/infrastructure/decorators/public.decorator';
import { TaskerOnboardingService } from 'src/modules/auth/application/services/onboarding/tasker-onboarding.service';
import { VendorOnboardingService } from 'src/modules/auth/application/services/onboarding/vendor-onboarding.service';
import {
  TaskerApplyRequestDto,
  TaskerKycUploadRequestDto,
  TaskerTrainingCompleteRequestDto,
} from 'src/modules/auth/application/dtos/onboarding/tasker-onboarding.dto';
import {
  VendorCreateRequestDto,
  VendorKycUploadRequestDto,
} from 'src/modules/auth/application/dtos/onboarding/vendor-onboarding.dto';

@Controller('api/v1')
export class OnboardingController {
  constructor(
    private taskerOnboardingService: TaskerOnboardingService,
    private vendorOnboardingService: VendorOnboardingService,
  ) {}

  /**
   * Tasker Onboarding Endpoints
   */

  /**
   * POST /api/v1/riders/apply
   * Submit tasker application
   */
  @Post('riders/apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async taskerApply(@Request() req: any, @Body() dto: TaskerApplyRequestDto) {
    const result = await this.taskerOnboardingService.apply(req.user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/v1/riders/kyc
   * Upload tasker KYC documents
   */
  @Post('riders/kyc')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async taskerUploadKyc(
    @Request() req: any,
    @Body() dto: TaskerKycUploadRequestDto,
  ) {
    const result = await this.taskerOnboardingService.uploadKyc(
      req.user.id,
      dto,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/v1/riders/training/complete
   * Complete tasker training
   */
  @Post('riders/training/complete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async taskerCompleteTraining(
    @Request() req: any,
    @Body() dto: TaskerTrainingCompleteRequestDto,
  ) {
    const result = await this.taskerOnboardingService.completeTraining(
      req.user.id,
      dto,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/v1/riders/me/onboarding-status
   * Get tasker onboarding status
   */
  @Get('riders/me/onboarding-status')
  @UseGuards(JwtAuthGuard)
  async getTaskerOnboardingStatus(@Request() req: any) {
    const result = await this.taskerOnboardingService.getOnboardingStatus(
      req.user.id,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Vendor Onboarding Endpoints
   */

  /**
   * POST /api/v1/vendors
   * Create vendor account
   */
  @Post('vendors')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async vendorCreate(@Request() req: any, @Body() dto: VendorCreateRequestDto) {
    const result = await this.vendorOnboardingService.create(req.user.id, dto);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/v1/vendors/:id/kyc
   * Upload vendor KYC documents
   */
  @Post('vendors/:id/kyc')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async vendorUploadKyc(
    @Request() req: any,
    @Body() dto: VendorKycUploadRequestDto,
  ) {
    const result = await this.vendorOnboardingService.uploadKyc(
      req.user.id,
      dto,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /api/v1/vendors/me/status
   * Get vendor onboarding status
   */
  @Get('vendors/me/status')
  @UseGuards(JwtAuthGuard)
  async getVendorOnboardingStatus(@Request() req: any) {
    const result = await this.vendorOnboardingService.getOnboardingStatus(
      req.user.id,
    );
    return {
      success: true,
      data: result,
    };
  }
}
