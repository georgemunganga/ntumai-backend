import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  ConversationMessagesResponseDto,
  ConversationResponseDto,
  GetOrCreateConversationDto,
  MarkConversationReadResponseDto,
  SendConversationMessageDto,
  SendMessageResponseDto,
} from '../../application/dtos/chat.dto';
import { ChatService } from '../../application/services/chat.service';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('context')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get or create a contextual conversation',
    description:
      'Creates or returns a conversation bound to a marketplace order, delivery, booking, or support ticket.',
  })
  @ApiResponse({
    status: 200,
    type: ConversationResponseDto,
  })
  async getOrCreateConversation(@Req() req: any, @Body() dto: GetOrCreateConversationDto) {
    return this.chatService.getOrCreateConversation(
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Get a single conversation' })
  @ApiResponse({
    status: 200,
    type: ConversationResponseDto,
  })
  async getConversation(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getConversation(req.user.userId, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'List messages for a conversation' })
  @ApiResponse({
    status: 200,
    type: ConversationMessagesResponseDto,
  })
  async getMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getMessages(req.user.userId, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to a conversation' })
  @ApiResponse({
    status: 200,
    type: SendMessageResponseDto,
  })
  async sendMessage(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendConversationMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.userId, conversationId, dto);
  }

  @Patch('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a conversation as read for the current user' })
  @ApiResponse({
    status: 200,
    type: MarkConversationReadResponseDto,
  })
  async markConversationRead(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.markConversationRead(
      req.user.userId,
      conversationId,
    );
  }
}
