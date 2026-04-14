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
  CreateSupportTicketDto,
  SupportTicketDetailResponseDto,
  SupportTicketListResponseDto,
  SupportTicketMutationResponseDto,
} from '../../application/dtos/support-ticket.dto';
import { SupportTicketsService } from '../../application/services/support-tickets.service';

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/support/tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List support tickets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Support tickets loaded successfully',
    type: SupportTicketListResponseDto,
  })
  async list(@Req() req: any) {
    return this.supportTicketsService.list(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a support ticket for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Support ticket created successfully',
    type: SupportTicketMutationResponseDto,
  })
  async create(@Req() req: any, @Body() dto: CreateSupportTicketDto) {
    return this.supportTicketsService.create(req.user.userId, dto);
  }

  @Get(':ticketId')
  @ApiOperation({ summary: 'Get a single support ticket for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Support ticket loaded successfully',
    type: SupportTicketDetailResponseDto,
  })
  async getOne(@Req() req: any, @Param('ticketId') ticketId: string) {
    return this.supportTicketsService.getOne(req.user.userId, ticketId);
  }
}
