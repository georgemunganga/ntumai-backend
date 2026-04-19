import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  ComplianceAppealResponseDto,
  ComplianceCaseListResponseDto,
  ComplianceSummaryResponseDto,
  CreateComplianceAppealDto,
} from '../../application/dtos/compliance.dto';
import { ComplianceService } from '../../application/services/compliance.service';

@ApiTags('Compliance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('tasker/summary')
  @ApiOperation({ summary: 'Get tasker compliance summary' })
  @ApiResponse({ status: 200, type: ComplianceSummaryResponseDto })
  async getTaskerSummary(@Req() req: any) {
    return this.complianceService.getTaskerSummary(
      req.user.userId,
      req.user.activeRole || req.user.role,
    );
  }

  @Get('tasker/cases')
  @ApiOperation({ summary: 'List tasker compliance cases' })
  @ApiResponse({ status: 200, type: ComplianceCaseListResponseDto })
  async listTaskerCases(@Req() req: any) {
    return this.complianceService.listTaskerCases(
      req.user.userId,
      req.user.activeRole || req.user.role,
    );
  }

  @Post('tasker/cases/:caseId/appeals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an appeal for a tasker compliance case' })
  @ApiResponse({ status: 200, type: ComplianceAppealResponseDto })
  async createAppeal(
    @Req() req: any,
    @Param('caseId') caseId: string,
    @Body() dto: CreateComplianceAppealDto,
  ) {
    return this.complianceService.createTaskerAppeal(
      req.user.userId,
      caseId,
      dto,
      req.user.activeRole || req.user.role,
    );
  }
}
