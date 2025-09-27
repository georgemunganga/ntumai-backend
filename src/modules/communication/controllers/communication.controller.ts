import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessageOrchestrationService } from '../application/services/message-orchestration.service';
import { TemplateManagementService } from '../application/services/template-management.service';
import { CommunicationDomainService } from '../domain/services/communication-domain.service';
import { MessageRecipient } from '../domain/value-objects/message-recipient.vo';
import { MessageContent } from '../domain/value-objects/message-content.vo';
import { CommunicationContext } from '../domain/value-objects/communication-context.vo';
import { MessagePriority } from '../domain/entities/message.entity';
import { TemplateType, TemplateCategory } from '../domain/entities/communication-template.entity';

// DTOs for API requests/responses
export class SendMessageDto {
  recipientType: 'email' | 'phone';
  recipientValue: string;
  channel: string;
  subject?: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  priority?: MessagePriority;
  scheduledAt?: Date;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: any;
  };
  metadata?: any;
}

export class BulkSendMessageDto {
  messages: SendMessageDto[];
  batchSize?: number;
  delayBetweenBatches?: number;
}

export class CreateTemplateDto {
  name: string;
  type: TemplateType;
  category: TemplateCategory;
  subject?: string;
  body: string;
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  metadata?: any;
}

export class UpdateTemplateDto {
  subject?: string;
  body?: string;
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  metadata?: any;
}

export class SendTemplateMessageDto {
  templateName: string;
  recipientType: 'email' | 'phone';
  recipientValue: string;
  channel: string;
  variables: Record<string, any>;
  priority?: MessagePriority;
  scheduledAt?: Date;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    metadata?: any;
  };
}

export class ValidateRecipientsDto {
  recipients: Array<{
    type: 'email' | 'phone';
    value: string;
  }>;
}

@ApiTags('Communication')
@Controller('communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(
    private readonly messageOrchestrationService: MessageOrchestrationService,
    private readonly templateManagementService: TemplateManagementService,
    private readonly communicationDomainService: CommunicationDomainService,
  ) {}

  @Post('messages/send')
  @ApiOperation({ summary: 'Send a single message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
      this.logger.debug(`Sending message to ${dto.recipientValue} via ${dto.channel}`);

      // Create value objects
      const recipient = MessageRecipient.create(dto.recipientType, dto.recipientValue);
      const attachments = (dto.attachments || []).map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
        size: Buffer.from(att.content, 'base64').length,
      }));
      const content = MessageContent.create(dto.body, dto.subject, attachments);
      const context = dto.context ? CommunicationContext.create(
        dto.context.userId,
        dto.context.sessionId,
        dto.context.requestId,
        dto.context.metadata,
      ) : undefined;

      const request = {
        recipient,
        channel: dto.channel,
        content,
        priority: dto.priority || MessagePriority.NORMAL,
        scheduledAt: dto.scheduledAt,
        context,
        metadata: dto.metadata,
      };

      const result = await this.messageOrchestrationService.sendMessage(request);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          status: result.status,
          estimatedDeliveryTime: result.estimatedDeliveryTime,
          channelUsed: result.channelUsed,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'SEND_MESSAGE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('messages/bulk-send')
  @ApiOperation({ summary: 'Send multiple messages in bulk' })
  @ApiResponse({ status: 201, description: 'Bulk messages processed successfully' })
  async bulkSendMessages(@Body() dto: BulkSendMessageDto) {
    try {
      this.logger.debug(`Bulk sending ${dto.messages.length} messages`);

      const requests = dto.messages.map(msg => {
        const recipient = MessageRecipient.create(msg.recipientType, msg.recipientValue);
        const attachments = (msg.attachments || []).map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
          size: Buffer.from(att.content, 'base64').length,
        }));
        const content = MessageContent.create(msg.body, msg.subject, attachments);
        const context = msg.context ? CommunicationContext.create(
          msg.context.userId,
          msg.context.sessionId,
          msg.context.requestId,
          msg.context.metadata,
        ) : undefined;

        return {
          recipient,
          channel: msg.channel,
          content,
          priority: msg.priority || MessagePriority.NORMAL,
          scheduledAt: msg.scheduledAt,
          context,
          metadata: msg.metadata,
        };
      });

      const bulkRequest = {
        messages: requests,
        batchSize: dto.batchSize || 10,
        delayBetweenBatches: dto.delayBetweenBatches || 1000,
      };

      const result = await this.messageOrchestrationService.bulkSendMessages(bulkRequest);

      return {
        success: true,
        data: {
          totalMessages: result.totalMessages,
          successfulMessages: result.successfulMessages,
          failedMessages: result.failedMessages,
          results: result.results,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to bulk send messages: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'BULK_SEND_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new communication template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    try {
      this.logger.debug(`Creating template: ${dto.name}`);

      const attachments = (dto.attachments || []).map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
        size: Buffer.from(att.content, 'base64').length,
      }));

      const template = await this.templateManagementService.createTemplate(
        dto.name,
        dto.type,
        dto.category,
        dto.subject,
        dto.body,
        dto.variables || [],
        attachments,
        dto.metadata,
      );

      return {
        success: true,
        data: {
          templateId: template.getId(),
          name: template.getName(),
          type: template.getType(),
          category: template.getCategory(),
          version: template.getVersion(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create template: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'CREATE_TEMPLATE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'List communication templates' })
  @ApiQuery({ name: 'type', required: false, enum: TemplateType })
  @ApiQuery({ name: 'category', required: false, enum: TemplateCategory })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listTemplates(
    @Query('type') type?: TemplateType,
    @Query('category') category?: TemplateCategory,
    @Query('active') active?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const filter = { type, category, isActive: active };
      const pagination = { offset: (page - 1) * limit, limit };

      const templates = await this.templateManagementService.listTemplates(filter, pagination);
      const total = await this.templateManagementService.countTemplates(filter);

      return {
        success: true,
        data: {
          templates: templates.map(template => ({
            id: template.getId(),
            name: template.getName(),
            type: template.getType(),
            category: template.getCategory(),
            isActive: template.isActive(),
            isApproved: template.isApproved(),
            version: template.getVersion(),
            createdAt: template.getCreatedAt(),
            updatedAt: template.getUpdatedAt(),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to list templates: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'LIST_TEMPLATES_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async getTemplate(@Param('id') id: string) {
    try {
      const template = await this.templateManagementService.getTemplate(id);
      
      if (!template) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found',
            },
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: {
          id: template.getId(),
          name: template.getName(),
          type: template.getType(),
          category: template.getCategory(),
          subject: template.getSubject(),
          body: template.getBody(),
          variables: template.getVariables(),
          attachments: template.getAttachments().map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
          })),
          isActive: template.isActive(),
          isApproved: template.isApproved(),
          version: template.getVersion(),
          metadata: template.getMetadata(),
          createdAt: template.getCreatedAt(),
          updatedAt: template.getUpdatedAt(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get template ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'GET_TEMPLATE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    try {
      const attachments = dto.attachments ? dto.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
        size: Buffer.from(att.content, 'base64').length,
      })) : undefined;

      const template = await this.templateManagementService.updateTemplate(
        id,
        dto.subject,
        dto.body,
        dto.variables,
        attachments,
        dto.metadata,
      );

      return {
        success: true,
        data: {
          templateId: template.getId(),
          version: template.getVersion(),
          updatedAt: template.getUpdatedAt(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update template ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'UPDATE_TEMPLATE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates/:id/activate')
  @ApiOperation({ summary: 'Activate template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async activateTemplate(@Param('id') id: string) {
    try {
      await this.templateManagementService.activateTemplate(id);
      return { success: true, message: 'Template activated successfully' };
    } catch (error) {
      this.logger.error(`Failed to activate template ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'ACTIVATE_TEMPLATE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async deactivateTemplate(@Param('id') id: string) {
    try {
      await this.templateManagementService.deactivateTemplate(id);
      return { success: true, message: 'Template deactivated successfully' };
    } catch (error) {
      this.logger.error(`Failed to deactivate template ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'DEACTIVATE_TEMPLATE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates/send')
  @ApiOperation({ summary: 'Send message using template' })
  @ApiResponse({ status: 201, description: 'Template message sent successfully' })
  async sendTemplateMessage(@Body() dto: SendTemplateMessageDto) {
    try {
      this.logger.debug(`Sending template message: ${dto.templateName} to ${dto.recipientValue}`);

      const recipient = MessageRecipient.create(dto.recipientType, dto.recipientValue);
      const context = dto.context ? CommunicationContext.create(
        dto.context.userId,
        dto.context.sessionId,
        dto.context.requestId,
        dto.context.metadata,
      ) : undefined;

      const request = {
        templateName: dto.templateName,
        recipient,
        channel: dto.channel,
        variables: dto.variables,
        priority: dto.priority || MessagePriority.NORMAL,
        scheduledAt: dto.scheduledAt,
        context,
      };

      const result = await this.messageOrchestrationService.sendTemplateMessage(request);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          status: result.status,
          estimatedDeliveryTime: result.estimatedDeliveryTime,
          channelUsed: result.channelUsed,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send template message: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'SEND_TEMPLATE_MESSAGE_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('recipients/validate')
  @ApiOperation({ summary: 'Validate recipients' })
  @ApiResponse({ status: 200, description: 'Recipients validated successfully' })
  async validateRecipients(@Body() dto: ValidateRecipientsDto) {
    try {
      const results = await Promise.all(
        dto.recipients.map(async (recipient) => {
          const isValid = await this.communicationDomainService.validateRecipient(
            recipient.type,
            recipient.value,
          );
          return {
            type: recipient.type,
            value: recipient.value,
            isValid,
          };
        }),
      );

      return {
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            valid: results.filter(r => r.isValid).length,
            invalid: results.filter(r => !r.isValid).length,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to validate recipients: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'VALIDATE_RECIPIENTS_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('channels/status')
  @ApiOperation({ summary: 'Get communication channels status' })
  @ApiResponse({ status: 200, description: 'Channels status retrieved successfully' })
  async getChannelsStatus() {
    try {
      const channels = await this.communicationDomainService.getAvailableChannels();
      const channelStatuses = await Promise.all(
        channels.map(async (channel) => {
          const status = await channel.getChannelStatus();
          return {
            name: channel.getChannelName(),
            providerId: channel.getProviderId(),
            supportedRecipientTypes: channel.getSupportedRecipientTypes(),
            priority: channel.getPriority(),
            isHealthy: status.isHealthy,
            lastHealthCheck: status.lastHealthCheck,
            rateLimitStatus: status.rateLimitStatus,
          };
        }),
      );

      return {
        success: true,
        data: {
          channels: channelStatuses,
          summary: {
            total: channelStatuses.length,
            healthy: channelStatuses.filter(c => c.isHealthy).length,
            unhealthy: channelStatuses.filter(c => !c.isHealthy).length,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get channels status: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'GET_CHANNELS_STATUS_FAILED',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}