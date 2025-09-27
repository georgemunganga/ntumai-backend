import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { CommunicationService } from '../../application/services/communication.service';
import {
  SendMessageDto,
  MessageResponseDto,
  ConversationDto,
  GetMessagesDto,
  PaginatedMessagesResponseDto,
  MarkMessagesReadDto,
  NotificationDto,
  SendNotificationDto,
  GetNotificationsDto,
  PaginatedNotificationsResponseDto,
  MarkNotificationsReadDto,
  CreateSupportTicketDto,
  SupportTicketResponseDto,
  GetSupportTicketsDto,
  PaginatedSupportTicketsResponseDto,
  UpdateSupportTicketDto,
} from '../dtos';

@ApiTags('Communication Management')
@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // Message Management
  @Post('messages')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot send message to this recipient',
  })
  async sendMessage(
    @Request() req: any,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    return this.communicationService.sendMessage(senderId, senderRole, sendMessageDto);
  }

  @Get('messages')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get user messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: PaginatedMessagesResponseDto,
  })
  async getUserMessages(
    @Request() req: any,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<PaginatedMessagesResponseDto> {
    const userId = req.user.id;
    return this.communicationService.getUserMessages(userId, getMessagesDto);
  }

  @Get('messages/:messageId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message retrieved successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getMessageById(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ): Promise<MessageResponseDto> {
    const userId = req.user.id;
    return this.communicationService.getMessageById(messageId, userId);
  }

  @Get('conversations')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    type: [ConversationDto],
  })
  async getUserConversations(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<ConversationDto[]> {
    const userId = req.user.id;
    return this.communicationService.getUserConversations(userId, { page, limit });
  }

  @Get('conversations/:conversationId/messages')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation messages retrieved successfully',
    type: PaginatedMessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getConversationMessages(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<PaginatedMessagesResponseDto> {
    const userId = req.user.id;
    return this.communicationService.getConversationMessages(conversationId, userId, {
      page,
      limit,
    });
  }

  @Put('messages/mark-read')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages marked as read successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message IDs',
  })
  @HttpCode(HttpStatus.OK)
  async markMessagesAsRead(
    @Request() req: any,
    @Body() markReadDto: MarkMessagesReadDto,
  ): Promise<void> {
    const userId = req.user.id;
    return this.communicationService.markMessagesAsRead(userId, markReadDto);
  }

  @Get('messages/unread/count')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get unread messages count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread messages count retrieved successfully',
  })
  async getUnreadMessagesCount(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    return this.communicationService.getUnreadMessagesCount(userId);
  }

  // Notification Management
  @Get('notifications')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: PaginatedNotificationsResponseDto,
  })
  async getUserNotifications(
    @Request() req: any,
    @Query() getNotificationsDto: GetNotificationsDto,
  ): Promise<PaginatedNotificationsResponseDto> {
    const userId = req.user.id;
    return this.communicationService.getUserNotifications(userId, getNotificationsDto);
  }

  @Get('notifications/:notificationId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: NotificationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getNotificationById(
    @Request() req: any,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationDto> {
    const userId = req.user.id;
    return this.communicationService.getNotificationById(notificationId, userId);
  }

  @Post('notifications')
  @Roles('ADMIN', 'SUPPORT', 'SYSTEM')
  @ApiOperation({ summary: 'Send notification (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification sent successfully',
    type: NotificationDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid notification data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async sendNotification(
    @Request() req: any,
    @Body() sendNotificationDto: SendNotificationDto,
  ): Promise<NotificationDto> {
    const senderId = req.user.id;
    return this.communicationService.sendNotification(senderId, sendNotificationDto);
  }

  @Put('notifications/mark-read')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications marked as read successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid notification IDs',
  })
  @HttpCode(HttpStatus.OK)
  async markNotificationsAsRead(
    @Request() req: any,
    @Body() markReadDto: MarkNotificationsReadDto,
  ): Promise<void> {
    const userId = req.user.id;
    return this.communicationService.markNotificationsAsRead(userId, markReadDto);
  }

  @Get('notifications/unread/count')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread notifications count retrieved successfully',
  })
  async getUnreadNotificationsCount(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    return this.communicationService.getUnreadNotificationsCount(userId);
  }

  // Support Ticket Management
  @Post('support/tickets')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Support ticket created successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ticket data',
  })
  async createSupportTicket(
    @Request() req: any,
    @Body() createTicketDto: CreateSupportTicketDto,
  ): Promise<SupportTicketResponseDto> {
    const riderId = req.user.id;
    return this.communicationService.createSupportTicket(riderId, createTicketDto);
  }

  @Get('support/tickets')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider support tickets' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support tickets retrieved successfully',
    type: PaginatedSupportTicketsResponseDto,
  })
  async getRiderSupportTickets(
    @Request() req: any,
    @Query() getTicketsDto: GetSupportTicketsDto,
  ): Promise<PaginatedSupportTicketsResponseDto> {
    const riderId = req.user.id;
    return this.communicationService.getRiderSupportTickets(riderId, getTicketsDto);
  }

  @Get('support/tickets/:ticketId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support ticket retrieved successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getSupportTicketById(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
  ): Promise<SupportTicketResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.communicationService.getSupportTicketById(ticketId, userId, userRole);
  }

  @Put('support/tickets/:ticketId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update support ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support ticket updated successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateSupportTicket(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() updateTicketDto: UpdateSupportTicketDto,
  ): Promise<SupportTicketResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.communicationService.updateSupportTicket(
      ticketId,
      userId,
      userRole,
      updateTicketDto,
    );
  }

  @Get('support/tickets/search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search all support tickets (Admin only)' })
  @ApiQuery({ name: 'riderId', description: 'Filter by rider ID', required: false })
  @ApiQuery({ name: 'status', description: 'Filter by ticket status', required: false })
  @ApiQuery({ name: 'priority', description: 'Filter by ticket priority', required: false })
  @ApiQuery({ name: 'category', description: 'Filter by ticket category', required: false })
  @ApiQuery({ name: 'assignedTo', description: 'Filter by assigned agent', required: false })
  @ApiQuery({ name: 'startDate', description: 'Filter by start date', required: false })
  @ApiQuery({ name: 'endDate', description: 'Filter by end date', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support tickets retrieved successfully',
    type: PaginatedSupportTicketsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchAllSupportTickets(
    @Query('riderId') riderId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedSupportTicketsResponseDto> {
    return this.communicationService.searchAllSupportTickets({
      riderId,
      status,
      priority,
      category,
      assignedTo,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Put('support/tickets/:ticketId/assign')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Assign support ticket to agent (Admin only)' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket assigned successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async assignSupportTicket(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() assignmentData: { assignedTo: string; notes?: string },
  ): Promise<SupportTicketResponseDto> {
    const assignedBy = req.user.id;
    return this.communicationService.assignSupportTicket(ticketId, assignedBy, assignmentData);
  }

  @Put('support/tickets/:ticketId/close')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Close support ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket closed successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async closeSupportTicket(
    @Request() req: any,
    @Param('ticketId') ticketId: string,
    @Body() closureData?: { resolution?: string; notes?: string },
  ): Promise<SupportTicketResponseDto> {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.communicationService.closeSupportTicket(ticketId, userId, userRole, closureData);
  }

  @Get('support/statistics')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get support statistics (Admin only)' })
  @ApiQuery({ name: 'period', description: 'Statistics period', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getSupportStatistics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<any> {
    return this.communicationService.getSupportStatistics(period);
  }

  @Post('notifications/bulk-send')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send bulk notifications (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk notifications sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk notification data',
  })
  async sendBulkNotifications(
    @Request() req: any,
    @Body() bulkNotificationData: {
      recipientIds: string[];
      notification: SendNotificationDto;
    },
  ): Promise<{ sent: number; failed: string[] }> {
    const senderId = req.user.id;
    return this.communicationService.sendBulkNotifications(senderId, bulkNotificationData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export communication data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'type', description: 'Export type (messages, notifications, tickets)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Communication data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportCommunicationData(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('type') type: 'messages' | 'notifications' | 'tickets' = 'messages',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.communicationService.exportCommunicationData(format, type, parsedFilters);
  }
}