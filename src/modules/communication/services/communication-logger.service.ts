import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ICommunicationLogger, CommunicationChannel } from '../interfaces/communication.interface';

export interface CommunicationLogEntry {
  userId?: string;
  channel: CommunicationChannel;
  recipient: string;
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class CommunicationLogger implements ICommunicationLogger {
  private readonly logger = new Logger(CommunicationLogger.name);
  private readonly enableDatabaseLogging: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.enableDatabaseLogging = this.configService.get<boolean>('ENABLE_COMMUNICATION_DB_LOGGING', true);
  }

  async logCommunication(
    userId: string | undefined,
    channel: CommunicationChannel,
    recipient: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const logEntry: CommunicationLogEntry = {
      userId,
      channel,
      recipient: this.maskRecipient(recipient, channel),
      success,
      messageId: metadata?.messageId,
      error: metadata?.error,
      metadata: this.sanitizeMetadata(metadata),
      createdAt: new Date(),
    };

    // Always log to application logger
    const logMessage = `Communication: ${channel} to ${logEntry.recipient} - Success: ${success}`;
    
    if (success) {
      this.logger.log(logMessage, {
        userId,
        messageId: metadata?.messageId,
        templateId: metadata?.templateId,
      });
    } else {
      this.logger.warn(logMessage, {
        userId,
        error: metadata?.error,
        attempt: metadata?.attempt,
      });
    }

    // Optionally log to database for audit trail
    if (this.enableDatabaseLogging) {
      try {
        await this.prisma.communicationLog.create({
          data: {
            userId,
            channel: channel.toString(),
            recipient: logEntry.recipient,
            success,
            messageId: logEntry.messageId,
            error: logEntry.error,
            metadata: logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
            createdAt: logEntry.createdAt,
          },
        });
      } catch (error) {
        this.logger.error('Failed to log communication to database', error);
      }
    }
  }

  async logEmailSent(
    userId: string | undefined,
    recipient: string,
    subject: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void> {
    await this.logCommunication(
      userId,
      CommunicationChannel.EMAIL,
      recipient,
      success,
      {
        messageId,
        error,
        subject,
        type: 'email',
      },
    );
  }

  async logSmsSent(
    userId: string | undefined,
    phoneNumber: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void> {
    await this.logCommunication(
      userId,
      CommunicationChannel.SMS,
      phoneNumber,
      success,
      {
        messageId,
        error,
        type: 'sms',
      },
    );
  }

  async logWhatsAppSent(
    userId: string | undefined,
    phoneNumber: string,
    success: boolean,
    messageId?: string,
    error?: string,
  ): Promise<void> {
    await this.logCommunication(
      userId,
      CommunicationChannel.WHATSAPP,
      phoneNumber,
      success,
      {
        messageId,
        error,
        type: 'whatsapp',
      },
    );
  }

  async logTemplateUsage(
    templateId: string,
    channel: CommunicationChannel,
    success: boolean,
    userId?: string,
  ): Promise<void> {
    const logMessage = `Template ${templateId} used for ${channel} - Success: ${success}`;
    
    if (success) {
      this.logger.log(logMessage, { templateId, channel, userId });
    } else {
      this.logger.warn(logMessage, { templateId, channel, userId });
    }

    if (this.enableDatabaseLogging) {
      try {
        await this.prisma.templateUsageLog.create({
          data: {
            templateId,
            channel: channel.toString(),
            userId,
            success,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error('Failed to log template usage to database', error);
      }
    }
  }

  async logBulkCommunication(
    channel: CommunicationChannel,
    totalCount: number,
    successCount: number,
    failureCount: number,
    userId?: string,
  ): Promise<void> {
    const logMessage = `Bulk ${channel} communication completed: ${successCount}/${totalCount} successful`;
    
    this.logger.log(logMessage, {
      channel,
      totalCount,
      successCount,
      failureCount,
      userId,
    });

    if (this.enableDatabaseLogging) {
      try {
        await this.prisma.bulkCommunicationLog.create({
          data: {
            channel: channel.toString(),
            totalCount,
            successCount,
            failureCount,
            userId,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error('Failed to log bulk communication to database', error);
      }
    }
  }

  async getCommunicationLogs(
    userId?: string,
    channel?: CommunicationChannel,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<CommunicationLogEntry[]> {
    if (!this.enableDatabaseLogging) {
      this.logger.warn('Database logging is disabled, cannot retrieve communication logs');
      return [];
    }

    try {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          ...(userId && { userId }),
          ...(channel && { channel: channel.toString() }),
          ...(startDate && endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return logs.map(log => ({
        userId: log.userId,
        channel: log.channel as CommunicationChannel,
        recipient: log.recipient,
        success: log.success,
        messageId: log.messageId,
        error: log.error,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve communication logs', error);
      return [];
    }
  }

  async getCommunicationStats(
    startDate: Date,
    endDate: Date,
    channel?: CommunicationChannel,
  ): Promise<{
    totalSent: number;
    successful: number;
    failed: number;
    successRate: number;
    byChannel: Record<string, { sent: number; successful: number; failed: number }>;
  }> {
    if (!this.enableDatabaseLogging) {
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        byChannel: {},
      };
    }

    try {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          ...(channel && { channel: channel.toString() }),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          channel: true,
          success: true,
        },
      });

      const totalSent = logs.length;
      const successful = logs.filter(log => log.success).length;
      const failed = totalSent - successful;
      const successRate = totalSent > 0 ? (successful / totalSent) * 100 : 0;

      const byChannel: Record<string, { sent: number; successful: number; failed: number }> = {};
      
      logs.forEach(log => {
        if (!byChannel[log.channel]) {
          byChannel[log.channel] = { sent: 0, successful: 0, failed: 0 };
        }
        byChannel[log.channel].sent++;
        if (log.success) {
          byChannel[log.channel].successful++;
        } else {
          byChannel[log.channel].failed++;
        }
      });

      return {
        totalSent,
        successful,
        failed,
        successRate,
        byChannel,
      };
    } catch (error) {
      this.logger.error('Failed to get communication stats', error);
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        byChannel: {},
      };
    }
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    if (!this.enableDatabaseLogging) {
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const [communicationResult, templateResult, bulkResult] = await Promise.all([
        this.prisma.communicationLog.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        }),
        this.prisma.templateUsageLog.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        }),
        this.prisma.bulkCommunicationLog.deleteMany({
          where: { createdAt: { lt: cutoffDate } },
        }),
      ]);

      const totalDeleted = communicationResult.count + templateResult.count + bulkResult.count;
      this.logger.log(`Cleaned up ${totalDeleted} old communication log entries`);
    } catch (error) {
      this.logger.error('Failed to cleanup old communication logs', error);
    }
  }

  private maskRecipient(recipient: string, channel: CommunicationChannel): string {
    switch (channel) {
      case CommunicationChannel.EMAIL:
        const [localPart, domain] = recipient.split('@');
        if (localPart && domain) {
          const maskedLocal = localPart.length > 2 
            ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
            : localPart;
          return `${maskedLocal}@${domain}`;
        }
        return recipient;
      
      case CommunicationChannel.SMS:
      case CommunicationChannel.WHATSAPP:
        if (recipient.length > 6) {
          return recipient.substring(0, 4) + '*'.repeat(recipient.length - 6) + recipient.substring(recipient.length - 2);
        }
        return recipient;
      
      default:
        return recipient;
    }
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    // Remove sensitive information from metadata
    const sanitized = { ...metadata };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;
    
    return sanitized;
  }
}