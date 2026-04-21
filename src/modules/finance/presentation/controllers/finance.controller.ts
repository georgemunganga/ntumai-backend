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
  CreateCustomerSubscriptionDto,
  CreateEarningsGoalDto,
  CreatePayoutRequestInputDto,
  CreateTipDto,
  FinanceRoleQueryDto,
  FinanceSummaryResponseDto,
  FinanceTransactionListResponseDto,
  FinancePayoutSettingsResponseDto,
  LoyaltyResponseDto,
  CustomerSubscriptionsResponseDto,
  TipHistoryItemDto,
  TipHistoryResponseDto,
  CustomerSubscriptionDto,
  PayoutRequestDto,
  PayoutRequestListResponseDto,
  EarningsGoalDto,
  EarningsGoalsResponseDto,
  PauseCustomerSubscriptionDto,
  RedeemLoyaltyRewardDto,
  SelectVendorSubscriptionPlanDto,
  UpdateFinancePayoutRulesDto,
  UpdatePayoutRequestStatusDto,
  VendorSubscriptionResponseDto,
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

  @Get('admin/payout-settings')
  @ApiOperation({ summary: 'Admin: get global payout rules' })
  @ApiResponse({ status: 200, type: FinancePayoutSettingsResponseDto })
  async getAdminPayoutSettings(@Req() req: any) {
    if (String(req.user.activeRole || '').toLowerCase() !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }

    return this.financeService.getAdminPayoutRules();
  }

  @Patch('admin/payout-settings')
  @ApiOperation({ summary: 'Admin: update global payout rules' })
  @ApiResponse({ status: 200, type: FinancePayoutSettingsResponseDto })
  async updateAdminPayoutSettings(
    @Req() req: any,
    @Body() dto: Record<'tasker' | 'vendor', UpdateFinancePayoutRulesDto>,
  ) {
    if (String(req.user.activeRole || '').toLowerCase() !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }

    return this.financeService.updateAdminPayoutRules(req.user.userId, dto);
  }

  @Get('vendor-subscription')
  @ApiOperation({ summary: 'Get current vendor subscription and available plans' })
  @ApiResponse({ status: 200, type: VendorSubscriptionResponseDto })
  async getVendorSubscription(@Req() req: any) {
    return this.financeService.getVendorSubscription(req.user.userId);
  }

  @Post('vendor-subscription/select-plan')
  @ApiOperation({ summary: 'Select or change the current vendor subscription plan' })
  @ApiResponse({ status: 200, type: VendorSubscriptionResponseDto })
  async selectVendorSubscriptionPlan(
    @Req() req: any,
    @Body() dto: SelectVendorSubscriptionPlanDto,
  ) {
    return this.financeService.selectVendorSubscriptionPlan(req.user.userId, dto);
  }

  @Get('loyalty')
  @ApiOperation({ summary: 'Get customer loyalty summary, transactions and rewards' })
  @ApiResponse({ status: 200, type: LoyaltyResponseDto })
  async getLoyalty(@Req() req: any) {
    return this.financeService.getLoyalty(req.user.userId);
  }

  @Post('loyalty/redeem')
  @ApiOperation({ summary: 'Redeem a customer loyalty reward' })
  @ApiResponse({ status: 200, type: LoyaltyResponseDto })
  async redeemLoyaltyReward(
    @Req() req: any,
    @Body() dto: RedeemLoyaltyRewardDto,
  ) {
    return this.financeService.redeemLoyaltyReward(req.user.userId, dto);
  }

  @Get('customer-subscriptions')
  @ApiOperation({ summary: 'Get customer subscription plans and active subscriptions' })
  @ApiResponse({ status: 200, type: CustomerSubscriptionsResponseDto })
  async getCustomerSubscriptions(@Req() req: any) {
    return this.financeService.getCustomerSubscriptions(req.user.userId);
  }

  @Post('customer-subscriptions')
  @ApiOperation({ summary: 'Subscribe to a customer delivery plan' })
  @ApiResponse({ status: 201, type: CustomerSubscriptionDto })
  async createCustomerSubscription(@Req() req: any, @Body() dto: CreateCustomerSubscriptionDto) {
    return this.financeService.createCustomerSubscription(req.user.userId, dto);
  }

  @Post('customer-subscriptions/:id/pause')
  @ApiOperation({ summary: 'Pause a customer subscription until a future date' })
  @ApiResponse({ status: 200, type: CustomerSubscriptionDto })
  async pauseCustomerSubscription(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: PauseCustomerSubscriptionDto,
  ) {
    return this.financeService.pauseCustomerSubscription(req.user.userId, id, dto);
  }

  @Post('customer-subscriptions/:id/resume')
  @ApiOperation({ summary: 'Resume a paused customer subscription' })
  @ApiResponse({ status: 200, type: CustomerSubscriptionDto })
  async resumeCustomerSubscription(@Req() req: any, @Param('id') id: string) {
    return this.financeService.resumeCustomerSubscription(req.user.userId, id);
  }

  @Post('customer-subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a customer subscription' })
  @ApiResponse({ status: 200, type: CustomerSubscriptionDto })
  async cancelCustomerSubscription(@Req() req: any, @Param('id') id: string) {
    return this.financeService.cancelCustomerSubscription(req.user.userId, id);
  }

  @Get('tips')
  @ApiOperation({ summary: 'Get customer tip history' })
  @ApiResponse({ status: 200, type: TipHistoryResponseDto })
  async getTipHistory(@Req() req: any) {
    return this.financeService.getTipHistory(req.user.userId);
  }

  @Post('tips')
  @ApiOperation({ summary: 'Create a customer tip for an order, delivery, or booking' })
  @ApiResponse({ status: 201, type: TipHistoryItemDto })
  async createTip(@Req() req: any, @Body() dto: CreateTipDto) {
    return this.financeService.createTip(req.user.userId, dto);
  }

  @Get('tasker/earnings-goals')
  @ApiOperation({ summary: 'Get tasker earnings goals' })
  @ApiResponse({ status: 200, type: EarningsGoalsResponseDto })
  async getTaskerEarningsGoals(@Req() req: any) {
    return {
      goals: await this.financeService.getTaskerEarningsGoals(req.user.userId),
    };
  }

  @Post('tasker/earnings-goals')
  @ApiOperation({ summary: 'Create a tasker earnings goal' })
  @ApiResponse({ status: 201, type: EarningsGoalDto })
  async createTaskerEarningsGoal(
    @Req() req: any,
    @Body() dto: CreateEarningsGoalDto,
  ) {
    return this.financeService.createTaskerEarningsGoal(req.user.userId, dto);
  }

  @Post('tasker/earnings-goals/:id/cancel')
  @ApiOperation({ summary: 'Cancel a tasker earnings goal' })
  @ApiResponse({ status: 200, type: EarningsGoalDto })
  async cancelTaskerEarningsGoal(@Req() req: any, @Param('id') id: string) {
    return this.financeService.cancelTaskerEarningsGoal(req.user.userId, id);
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
