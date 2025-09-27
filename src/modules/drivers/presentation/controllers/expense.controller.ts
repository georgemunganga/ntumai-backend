import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { ExpenseService } from '../../application/services/expense.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseResponseDto,
  GetExpensesDto,
  PaginatedExpensesResponseDto,
  ExpenseSummaryDto,
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentResponseDto,
  GetIncidentsDto,
  PaginatedIncidentsResponseDto,
} from '../dtos';

@ApiTags('Expense & Incident Management')
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // Expense Management
  @Post()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Create expense record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Expense created successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid expense data',
  })
  async createExpense(
    @Request() req: any,
    @Body() createExpenseDto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.createExpense(riderId, createExpenseDto);
  }

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider expenses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expenses retrieved successfully',
    type: PaginatedExpensesResponseDto,
  })
  async getRiderExpenses(
    @Request() req: any,
    @Query() getExpensesDto: GetExpensesDto,
  ): Promise<PaginatedExpensesResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.getRiderExpenses(riderId, getExpensesDto);
  }

  @Get(':expenseId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense retrieved successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getExpenseById(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
  ): Promise<ExpenseResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.expenseService.getExpenseById(expenseId, userId, userRole);
  }

  @Put(':expenseId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update expense' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense updated successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update expense in current status',
  })
  async updateExpense(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.updateExpense(expenseId, riderId, updateExpenseDto);
  }

  @Delete(':expenseId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Expense deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete expense in current status',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.expenseService.deleteExpense(expenseId, riderId);
  }

  @Post(':expenseId/receipt')
  @Roles('DRIVER')
  @UseInterceptors(FileInterceptor('receipt'))
  @ApiOperation({ summary: 'Upload expense receipt' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt uploaded successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format',
  })
  async uploadExpenseReceipt(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExpenseResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.uploadExpenseReceipt(expenseId, riderId, file);
  }

  @Delete(':expenseId/receipt')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete expense receipt' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt deleted successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense or receipt not found',
  })
  async deleteExpenseReceipt(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
  ): Promise<ExpenseResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.deleteExpenseReceipt(expenseId, riderId);
  }

  @Get('summary/daily')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get daily expense summary' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily expense summary retrieved successfully',
    type: ExpenseSummaryDto,
  })
  async getDailyExpenseSummary(
    @Request() req: any,
    @Query('date') date?: string,
  ): Promise<ExpenseSummaryDto> {
    const riderId = req.user.id;
    const targetDate = date ? new Date(date) : new Date();
    return this.expenseService.getDailyExpenseSummary(riderId, targetDate);
  }

  @Get('summary/weekly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get weekly expense summary' })
  @ApiQuery({ name: 'startDate', description: 'Week start date (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly expense summary retrieved successfully',
    type: ExpenseSummaryDto,
  })
  async getWeeklyExpenseSummary(
    @Request() req: any,
    @Query('startDate') startDate?: string,
  ): Promise<ExpenseSummaryDto> {
    const riderId = req.user.id;
    const weekStart = startDate ? new Date(startDate) : undefined;
    return this.expenseService.getWeeklyExpenseSummary(riderId, weekStart);
  }

  @Get('summary/monthly')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get monthly expense summary' })
  @ApiQuery({ name: 'year', description: 'Year', required: false })
  @ApiQuery({ name: 'month', description: 'Month (1-12)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly expense summary retrieved successfully',
    type: ExpenseSummaryDto,
  })
  async getMonthlyExpenseSummary(
    @Request() req: any,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ): Promise<ExpenseSummaryDto> {
    const riderId = req.user.id;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;
    return this.expenseService.getMonthlyExpenseSummary(riderId, targetYear, targetMonth);
  }

  @Get('analytics/trends')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get expense trends analytics' })
  @ApiQuery({ name: 'period', description: 'Analysis period', required: false })
  @ApiQuery({ name: 'category', description: 'Expense category filter', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense trends retrieved successfully',
  })
  async getExpenseTrends(
    @Request() req: any,
    @Query('period') period: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    @Query('category') category?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.expenseService.getExpenseTrends(riderId, period, category);
  }

  @Get('categories/breakdown')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get expense category breakdown' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense category breakdown retrieved successfully',
  })
  async getExpenseCategoryBreakdown(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const riderId = req.user.id;
    return this.expenseService.getExpenseCategoryBreakdown(
      riderId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // Incident Management
  @Post('incidents')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Report incident' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Incident reported successfully',
    type: IncidentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid incident data',
  })
  async reportIncident(
    @Request() req: any,
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IncidentResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.reportIncident(riderId, createIncidentDto);
  }

  @Get('incidents')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider incidents' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidents retrieved successfully',
    type: PaginatedIncidentsResponseDto,
  })
  async getRiderIncidents(
    @Request() req: any,
    @Query() getIncidentsDto: GetIncidentsDto,
  ): Promise<PaginatedIncidentsResponseDto> {
    const riderId = req.user.id;
    return this.expenseService.getRiderIncidents(riderId, getIncidentsDto);
  }

  @Get('incidents/:incidentId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get incident by ID' })
  @ApiParam({ name: 'incidentId', description: 'Incident ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incident retrieved successfully',
    type: IncidentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Incident not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getIncidentById(
    @Request() req: any,
    @Param('incidentId') incidentId: string,
  ): Promise<IncidentResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.expenseService.getIncidentById(incidentId, userId, userRole);
  }

  @Put('incidents/:incidentId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update incident' })
  @ApiParam({ name: 'incidentId', description: 'Incident ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incident updated successfully',
    type: IncidentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Incident not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateIncident(
    @Request() req: any,
    @Param('incidentId') incidentId: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.expenseService.updateIncident(incidentId, userId, userRole, updateIncidentDto);
  }

  // Admin/Support Endpoints
  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all expenses (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'category', description: 'Filter by expense category', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by expense status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'minAmount', description: 'Filter by minimum amount', required: false })
  @ApiQuery({ name: 'maxAmount', description: 'Filter by maximum amount', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expenses retrieved successfully',
    type: PaginatedExpensesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllExpenses(
    @Query('riderId') riderId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedExpensesResponseDto> {
    return this.expenseService.searchAllExpenses({
      riderId,
      category,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minAmount,
      maxAmount,
      page,
      limit,
    });
  }

  @Get('incidents/search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all incidents (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'type', description: 'Filter by incident type', required: false })
  @ApiQuery({ name: 'severity', description: 'Filter by incident severity', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by incident status', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Incidents retrieved successfully',
    type: PaginatedIncidentsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllIncidents(
    @Query('riderId') riderId?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedIncidentsResponseDto> {
    return this.expenseService.searchAllIncidents({
      riderId,
      type,
      severity,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get expense statistics overview (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getExpenseStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.expenseService.getExpenseStatistics(period);
  }

  @Put(':expenseId/approve')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Approve expense (Admin only)' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense approved successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async approveExpense(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
    @Body() approvalData?: { notes?: string },
  ): Promise<ExpenseResponseDto> {
    const approvedBy = req.user.id;
    return this.expenseService.approveExpense(expenseId, approvedBy, approvalData);
  }

  @Put(':expenseId/reject')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Reject expense (Admin only)' })
  @ApiParam({ name: 'expenseId', description: 'Expense ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense rejected successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async rejectExpense(
    @Request() req: any,
    @Param('expenseId') expenseId: string,
    @Body() rejectionData: { reason: string; notes?: string },
  ): Promise<ExpenseResponseDto> {
    const rejectedBy = req.user.id;
    return this.expenseService.rejectExpense(expenseId, rejectedBy, rejectionData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export expense data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'type', description: 'Export type (expenses, incidents)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportExpenseData(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('type') type: 'expenses' | 'incidents' = 'expenses',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.expenseService.exportExpenseData(format, type, parsedFilters);
  }
}