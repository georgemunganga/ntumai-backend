import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunicationsService } from './application/services/communications.service';
import { EmailProvider } from './infrastructure/providers/email.provider';
import { SmsProvider } from './infrastructure/providers/sms.provider';

@Module({
  imports: [ConfigModule],
  providers: [CommunicationsService, EmailProvider, SmsProvider],
  exports: [CommunicationsService, EmailProvider, SmsProvider],
})
export class CommunicationsModule {}
