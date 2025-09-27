import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IMessageService,
  IEmailService,
  ISMSService,
  IWhatsAppService,
  ICommunicationLogger,
  MessagePayload,
  CommunicationResult,
  CommunicationChannel,
} from '../interfaces/communication.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class MessageService implements IMessageService {
  private readonly logger = new Logger(MessageService.name);
  private readonly defaultRetryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('ISMSService') private readonly smsService: ISMSService,
    @Inject('IWhatsAppService') private readonly whatsAppService: IWhatsAppService,
    @Inject('ICommunicationLogger') private readonly communicationLogger: ICommunicationLogger,
    private readonly configService: ConfigService,
  ) {
    this.defaultRetryAttempts = this.configService.get<number>('COMMUNICATION_RETRY_ATTEMPTS', 3);
    this.retryDelayMs = this.configService.get<number>('COMMUNICATION_RETRY_DELAY_MS', 1000);
  }

  async sendMessage(
    payload: MessagePayload,
    retryAttempts?: number,
  ): Promise<CommunicationResult> {
    const attempts = retryAttempts ?? this.defaultRetryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        this.logger.log(
          `Sending ${payload.channel} message to ${payload.recipient} (attempt ${attempt}/${attempts})`,
        );

        let result: CommunicationResult;

        switch (payload.channel) {
          case CommunicationChannel.EMAIL:
            result = await this.emailService.sendEmail({
              to: payload.recipient,
              subject: payload.subject || 'Notification',
              content: payload.content,
              templateId: payload.templateId,
              templateData: payload.templateData,
              attachments: payload.attachments,
            });
            break;

          case CommunicationChannel.SMS:
            result = await this.smsService.sendSMS({
              phoneNumber: payload.recipient,
              message: payload.content,
              templateId: payload.templateId,
              templateData: payload.templateData,
            });
            break;

          case CommunicationChannel.WHATSAPP:
            result = await this.whatsAppService.sendWhatsApp({
              phoneNumber: payload.recipient,
              message: payload.content,
              templateId: payload.templateId,
              templateData: payload.templateData,
              mediaUrl: payload.mediaUrl,
            });
            break;

          default:
            throw new Error(`Unsupported communication channel: ${payload.channel}`);
        }

        // Log successful delivery
        await this.communicationLogger.logCommunication(
          payload.userId,
          payload.channel,
          payload.recipient,
          true,
          {
            messageId: result.messageId,
            attempt,
            templateId: payload.templateId,
          },
        );

        this.logger.log(
          `Message sent successfully via ${payload.channel} to ${payload.recipient} (messageId: ${result.messageId})`,
        );

        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Failed to send ${payload.channel} message to ${payload.recipient} (attempt ${attempt}/${attempts}): ${error.message}`,
        );

        // Log failed attempt
        await this.communicationLogger.logCommunication(
          payload.userId,
          payload.channel,
          payload.recipient,
          false,
          {
            error: error.message,
            attempt,
            templateId: payload.templateId,
          },
        );

        // Wait before retry (except for last attempt)
        if (attempt < attempts) {
          await this.delay(this.retryDelayMs * attempt); // Exponential backoff
        }
      }
    }

    // All attempts failed
    const errorMessage = `Failed to send ${payload.channel} message after ${attempts} attempts: ${lastError?.message}`;
    this.logger.error(errorMessage);

    return {
      success: false,
      messageId: null,
      error: errorMessage,
      provider: payload.channel,
    };
  }

  async sendBulkMessages(
    payloads: MessagePayload[],
    batchSize: number = 10,
  ): Promise<CommunicationResult[]> {
    const results: CommunicationResult[] = [];
    
    this.logger.log(`Sending ${payloads.length} messages in batches of ${batchSize}`);

    // Process messages in batches to avoid overwhelming providers
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      
      const batchPromises = batch.map(payload => 
        this.sendMessage(payload).catch(error => ({
          success: false,
          messageId: null,
          error: error.message,
          provider: payload.channel,
        } as CommunicationResult))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < payloads.length) {
        await this.delay(500);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    this.logger.log(
      `Bulk message sending completed: ${successCount} successful, ${failureCount} failed`,
    );

    return results;
  }

  async getMessageStatus(messageId: string, channel: CommunicationChannel): Promise<any> {
    try {
      switch (channel) {
        case CommunicationChannel.EMAIL:
          return await this.emailService.getDeliveryStatus(messageId);
        case CommunicationChannel.SMS:
          return await this.smsService.getDeliveryStatus(messageId);
        case CommunicationChannel.WHATSAPP:
          return await this.whatsAppService.getDeliveryStatus(messageId);
        default:
          throw new Error(`Unsupported channel for status check: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get message status for ${messageId}`, error);
      throw error;
    }
  }

  async validateRecipient(recipient: string, channel: CommunicationChannel): Promise<boolean> {
    try {
      switch (channel) {
        case CommunicationChannel.EMAIL:
          return this.isValidEmail(recipient);
        case CommunicationChannel.SMS:
        case CommunicationChannel.WHATSAPP:
          return this.isValidPhoneNumber(recipient);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to validate recipient ${recipient} for ${channel}`, error);
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}