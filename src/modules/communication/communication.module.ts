import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';

// Controllers
import { CommunicationController } from './controllers/communication.controller';

// Legacy services (kept for backward compatibility)
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';
import { MessageService } from './services/message.service';
import { CommunicationLogger } from './services/communication-logger.service';

// Legacy interfaces
import {
  IEmailService,
  ISMSService,
  IWhatsAppService,
  IMessageService,
  ICommunicationLogger,
} from './interfaces/communication.interface';

// New DDD components
import { CommunicationDomainService } from './domain/services/communication-domain.service';
import { MessageOrchestrationService } from './application/services/message-orchestration.service';
import { TemplateManagementService } from './application/services/template-management.service';

// Infrastructure adapters
import { EmailChannelAdapter } from './infrastructure/adapters/email-channel.adapter';
import { SmsChannelAdapter } from './infrastructure/adapters/sms-channel.adapter';
import { WhatsAppChannelAdapter } from './infrastructure/adapters/whatsapp-channel.adapter';

// Repository implementations
import {
  MessageRepositoryImpl,
  CommunicationTemplateRepositoryImpl,
  DeliveryResultRepositoryImpl,
  CommunicationUnitOfWorkImpl,
} from './infrastructure/persistence/communication.repository.impl';

// Repository interfaces
import {
  IMessageRepository,
  ICommunicationTemplateRepository,
  IDeliveryResultRepository,
  ICommunicationUnitOfWork,
} from './domain/repositories/communication.repository';

// Domain interfaces
import { ICommunicationChannel } from './domain/interfaces/communication-domain.interface';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [CommunicationController],
  providers: [
    // Legacy services (for backward compatibility)
    EmailService,
    SmsService,
    WhatsAppService,
    MessageService,
    CommunicationLogger,
    
    // Legacy interface bindings
    {
      provide: 'IEmailService',
      useClass: EmailService,
    },
    {
      provide: 'ISMSService',
      useClass: SmsService,
    },
    {
      provide: 'IWhatsAppService',
      useClass: WhatsAppService,
    },
    {
      provide: 'IMessageService',
      useClass: MessageService,
    },
    {
      provide: 'ICommunicationLogger',
      useClass: CommunicationLogger,
    },

    // New DDD Domain Services
    CommunicationDomainService,

    // New DDD Application Services
    MessageOrchestrationService,
    TemplateManagementService,

    // Infrastructure Channel Adapters
    EmailChannelAdapter,
    SmsChannelAdapter,
    WhatsAppChannelAdapter,

    // Repository implementations
    MessageRepositoryImpl,
    CommunicationTemplateRepositoryImpl,
    DeliveryResultRepositoryImpl,
    CommunicationUnitOfWorkImpl,

    // Repository interface bindings
    {
      provide: 'IMessageRepository',
      useClass: MessageRepositoryImpl,
    },
    {
      provide: 'ICommunicationTemplateRepository',
      useClass: CommunicationTemplateRepositoryImpl,
    },
    {
      provide: 'IDeliveryResultRepository',
      useClass: DeliveryResultRepositoryImpl,
    },
    {
      provide: 'ICommunicationUnitOfWork',
      useFactory: (prisma, messageRepo, templateRepo, deliveryRepo) => {
        return new CommunicationUnitOfWorkImpl(prisma, messageRepo, templateRepo, deliveryRepo);
      },
      inject: ['PrismaService', 'IMessageRepository', 'ICommunicationTemplateRepository', 'IDeliveryResultRepository'],
    },

    // Communication channels as multi-providers
    {
      provide: 'ICommunicationChannel',
      useClass: EmailChannelAdapter,
      multi: true,
    },
    {
      provide: 'ICommunicationChannel',
      useClass: SmsChannelAdapter,
      multi: true,
    },
    {
      provide: 'ICommunicationChannel',
      useClass: WhatsAppChannelAdapter,
      multi: true,
    },
  ],
  exports: [
    // Legacy exports (for backward compatibility)
    'IEmailService',
    'ISMSService',
    'IWhatsAppService',
    'IMessageService',
    'ICommunicationLogger',
    EmailService,
    SmsService,
    WhatsAppService,
    MessageService,
    CommunicationLogger,

    // New DDD exports
    CommunicationDomainService,
    MessageOrchestrationService,
    TemplateManagementService,
    
    // Infrastructure adapters
    EmailChannelAdapter,
    SmsChannelAdapter,
    WhatsAppChannelAdapter,

    // Repository interfaces
    'IMessageRepository',
    'ICommunicationTemplateRepository',
    'IDeliveryResultRepository',
    'ICommunicationUnitOfWork',
    'ICommunicationChannel',
  ],
})
export class CommunicationModule {}