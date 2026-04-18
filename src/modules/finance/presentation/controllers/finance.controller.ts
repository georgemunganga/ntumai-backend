import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  CreatePayoutRequestInputDto,
  FinanceRoleQueryDto,
  FinanceSummaryResponseDto,
  FinanceTransactionListResponseDto,
  PayoutRequestDto,
  PayoutRequestListResponseDto,
  UpdatePayoutRequestStatusDto,
} from '../../application/dtos/finance.dto';
import { FinanceService } from '../../application/services/finance.service';

@ApiTags('Finance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get finance summary for the requested role' })
  @ApiResponse({ status: 200, type: FinanceSummaryResponseDto })
  async getSummary(@Req() req: any, @Query() query: FinanceRoleQueryDto) {
    return this.financeService.getSummary(req.user.userId, query.role);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get finance activity for the requested role' })
  @ApiQuery({ name: 'role', required: true, enum: ['customer', 'tasker', 'vendor'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: FinanceTransactionListResponseDto })
  async getTransactions(
    @Req() req: any,
    @Query() query: FinanceRoleQueryDto & { limit?: string },
  ) {
    return {
      transactions: await this.financeService.getTransactions(
        req.user.userId,
        query.role,
        Number(query.limit),
      ),
    };
  }

  @Get('payout-requests')
  @ApiOperation({ summary: 'List payout requests for vendor or tasker' })
  @ApiResponse({ status: 200, type: PayoutRequestListResponseDto })
  async listPayoutRequests(@Req() req: any, @Query() query: FinanceRoleQueryDto) {
    return {
      payoutRequests: await this.financeService.listPayoutRequests(
        req.user.userId,
        query.role,
      ),
    };
  }

  @Post('payout-requests')
  @ApiOperation({ summary: 'Create a payout request for vendor or tasker' })
  @ApiResponse({ status: 201, type: PayoutRequestDto })
  async createPayoutRequest(
    @Req() req: any,
    @Body() dto: CreatePayoutRequestInputDto,
  ) {
    return this.financeService.createPayoutRequest(req.user.userId, dto);
  }

  @Patch('payout-requests/:id/status')
  @ApiOperation({ summary: 'Admin: update payout request status' })
  @ApiResponse({ status: 200, type: PayoutRequestDto })
  async updatePayoutRequestStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePayoutRequestStatusDto,
  ) {
    if (String(req.user.activeRole || '').toLowerCase() !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }

    return this.financeService.updatePayoutRequestStatus(
      req.user.userId,
      id,
      dto,
    );
  }
}
