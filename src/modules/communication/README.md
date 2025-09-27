# Communication Module - Domain-Driven Design Implementation

This module provides a comprehensive communication system built using Domain-Driven Design (DDD) principles. It supports multiple communication channels (Email, SMS, WhatsApp) with a unified interface, template management, and robust error handling.

## Architecture Overview

The module follows DDD architecture with clear separation of concerns:

```
communication/
├── domain/                     # Core business logic
│   ├── entities/              # Domain entities
│   ├── value-objects/         # Value objects
│   ├── services/              # Domain services
│   ├── interfaces/            # Domain interfaces
│   └── repositories/          # Repository contracts
├── application/               # Application services
│   └── services/              # Use case orchestration
├── infrastructure/            # External concerns
│   ├── adapters/              # Channel implementations
│   └── persistence/           # Data persistence
├── controllers/               # API endpoints
├── services/                  # Legacy services (backward compatibility)
└── interfaces/                # Legacy interfaces
```

## Key Components

### Domain Layer

#### Entities
- **Message**: Core message entity with status tracking and retry logic
- **CommunicationTemplate**: Template entity with versioning and approval workflow

#### Value Objects
- **MessageRecipient**: Encapsulates recipient validation and formatting
- **MessageContent**: Handles message content with attachments
- **CommunicationContext**: Request tracking and metadata
- **DeliveryResult**: Communication outcome representation

#### Domain Services
- **CommunicationDomainService**: Core business logic for communication operations

### Application Layer

#### Services
- **MessageOrchestrationService**: Orchestrates message sending workflows
- **TemplateManagementService**: Manages communication templates

### Infrastructure Layer

#### Channel Adapters
- **EmailChannelAdapter**: SMTP email implementation
- **SmsChannelAdapter**: Twilio SMS implementation
- **WhatsAppChannelAdapter**: Twilio WhatsApp implementation

#### Persistence
- **Repository Implementations**: Prisma-based data persistence

## Usage Examples

### 1. Sending a Simple Message

```typescript
import { MessageOrchestrationService } from './application/services/message-orchestration.service';
import { MessageRecipient } from './domain/value-objects/message-recipient.vo';
import { MessageContent } from './domain/value-objects/message-content.vo';
import { MessagePriority } from './domain/entities/message.entity';

@Injectable()
export class NotificationService {
  constructor(
    private readonly messageOrchestration: MessageOrchestrationService,
  ) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    const recipient = MessageRecipient.create('email', userEmail);
    const content = MessageContent.create(
      `Welcome ${userName}! Thank you for joining our platform.`,
      'Welcome to Our Platform',
    );

    const request = {
      recipient,
      channel: 'email',
      content,
      priority: MessagePriority.HIGH,
    };

    const result = await this.messageOrchestration.sendMessage(request);
    return result;
  }
}
```

### 2. Using Templates

```typescript
import { TemplateManagementService } from './application/services/template-management.service';
import { TemplateType, TemplateCategory } from './domain/entities/communication-template.entity';

@Injectable()
export class TemplateService {
  constructor(
    private readonly templateManagement: TemplateManagementService,
    private readonly messageOrchestration: MessageOrchestrationService,
  ) {}

  async createWelcomeTemplate() {
    const template = await this.templateManagement.createTemplate(
      'welcome-email',
      TemplateType.EMAIL,
      TemplateCategory.TRANSACTIONAL,
      'Welcome {{userName}}!',
      'Hello {{userName}}, welcome to {{platformName}}!',
      [
        { name: 'userName', type: 'string', required: true },
        { name: 'platformName', type: 'string', required: true },
      ],
    );

    await this.templateManagement.activateTemplate(template.getId());
    return template;
  }

  async sendWelcomeUsingTemplate(userEmail: string, variables: Record<string, any>) {
    const recipient = MessageRecipient.create('email', userEmail);
    
    const request = {
      templateName: 'welcome-email',
      recipient,
      channel: 'email',
      variables,
      priority: MessagePriority.HIGH,
    };

    return await this.messageOrchestration.sendTemplateMessage(request);
  }
}
```

### 3. Bulk Message Sending

```typescript
@Injectable()
export class BulkNotificationService {
  constructor(
    private readonly messageOrchestration: MessageOrchestrationService,
  ) {}

  async sendBulkNotifications(users: Array<{ email: string; name: string }>) {
    const messages = users.map(user => {
      const recipient = MessageRecipient.create('email', user.email);
      const content = MessageContent.create(
        `Hello ${user.name}, we have an important update for you.`,
        'Important Update',
      );

      return {
        recipient,
        channel: 'email',
        content,
        priority: MessagePriority.NORMAL,
      };
    });

    const bulkRequest = {
      messages,
      batchSize: 10,
      delayBetweenBatches: 2000, // 2 seconds
    };

    return await this.messageOrchestration.bulkSendMessages(bulkRequest);
  }
}
```

### 4. Multi-Channel Communication

```typescript
@Injectable()
export class MultiChannelService {
  constructor(
    private readonly communicationDomain: CommunicationDomainService,
    private readonly messageOrchestration: MessageOrchestrationService,
  ) {}

  async sendUrgentNotification(email: string, phone: string, message: string) {
    // Try multiple channels with priority
    const channels = ['email', 'sms', 'whatsapp'];
    const results = [];

    for (const channel of channels) {
      try {
        const recipientType = channel === 'email' ? 'email' : 'phone';
        const recipientValue = channel === 'email' ? email : phone;
        
        const recipient = MessageRecipient.create(recipientType, recipientValue);
        const content = MessageContent.create(message, 'Urgent Notification');

        const request = {
          recipient,
          channel,
          content,
          priority: MessagePriority.URGENT,
        };

        const result = await this.messageOrchestration.sendMessage(request);
        results.push({ channel, success: true, result });
        
        // If email succeeds, we might not need SMS/WhatsApp
        if (channel === 'email' && result.status === 'sent') {
          break;
        }
      } catch (error) {
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }
}
```

## API Endpoints

The module provides RESTful API endpoints through `CommunicationController`:

### Message Operations
- `POST /communication/messages/send` - Send single message
- `POST /communication/messages/bulk-send` - Send bulk messages
- `POST /communication/templates/send` - Send using template

### Template Management
- `POST /communication/templates` - Create template
- `GET /communication/templates` - List templates
- `GET /communication/templates/:id` - Get template
- `PUT /communication/templates/:id` - Update template
- `POST /communication/templates/:id/activate` - Activate template
- `POST /communication/templates/:id/deactivate` - Deactivate template

### Utility Operations
- `POST /communication/recipients/validate` - Validate recipients
- `GET /communication/channels/status` - Get channel status

## Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Your App Name
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_TEMPLATE_PATH=./templates/email

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=optional-messaging-service-sid

# WhatsApp Configuration (Twilio)
TWILIO_WHATSAPP_FROM_NUMBER=whatsapp:+1234567890

# Rate Limiting
EMAIL_RATE_LIMIT_PER_SECOND=2
EMAIL_RATE_LIMIT_PER_MINUTE=60
EMAIL_RATE_LIMIT_PER_HOUR=1000

TWILIO_RATE_LIMIT_PER_SECOND=1
TWILIO_RATE_LIMIT_PER_MINUTE=30
TWILIO_RATE_LIMIT_PER_HOUR=1000

WHATSAPP_RATE_LIMIT_PER_SECOND=1
WHATSAPP_RATE_LIMIT_PER_MINUTE=20
WHATSAPP_RATE_LIMIT_PER_HOUR=500
```

## Database Schema

The module requires the following Prisma schema additions:

```prisma
model Message {
  id                String    @id @default(cuid())
  recipient_type    String    // 'email' or 'phone'
  recipient_value   String
  channel          String    // 'email', 'sms', 'whatsapp'
  subject          String?
  body             String
  attachments      Json      @default("[]")
  status           String    @default("pending")
  priority         String    @default("normal")
  retry_count      Int       @default(0)
  max_retries      Int       @default(3)
  scheduled_at     DateTime?
  sent_at          DateTime?
  delivered_at     DateTime?
  failed_at        DateTime?
  context_user_id  String?
  context_session_id String?
  context_request_id String?
  context_metadata Json      @default("{}")
  metadata         Json      @default("{}")
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  @@map("messages")
}

model CommunicationTemplate {
  id           String    @id @default(cuid())
  name         String    @unique
  type         String    // 'email', 'sms', 'whatsapp'
  category     String    // 'transactional', 'marketing', 'notification'
  subject      String?
  body         String
  variables    Json      @default("[]")
  attachments  Json      @default("[]")
  is_active    Boolean   @default(false)
  is_approved  Boolean   @default(false)
  version      Int       @default(1)
  metadata     Json      @default("{}")
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt

  @@map("communication_templates")
}

model DeliveryResult {
  id                    String    @id @default(cuid())
  message_id           String
  provider_id          String
  provider_message_id  String?
  success              Boolean
  delivery_timestamp   DateTime
  retry_count          Int       @default(0)
  error_code           String?
  error_message        String?
  error_type           String?
  error_retry_after_ms Int?
  metadata             Json      @default("{}")
  created_at           DateTime  @default(now())

  @@map("delivery_results")
}
```

## Features

### ✅ Implemented Features
- **Multi-Channel Support**: Email, SMS, WhatsApp
- **Template Management**: Create, update, activate/deactivate templates
- **Message Queuing**: Priority-based message processing
- **Retry Logic**: Configurable retry strategies
- **Rate Limiting**: Per-channel rate limiting
- **Bulk Operations**: Efficient bulk message sending
- **Validation**: Recipient validation (email/phone)
- **Health Monitoring**: Channel health checks
- **Error Handling**: Comprehensive error categorization
- **Audit Trail**: Complete message delivery tracking
- **Context Tracking**: Request correlation and metadata
- **Attachment Support**: File attachments for supported channels

### 🔄 Backward Compatibility
- Legacy services are maintained for existing integrations
- Gradual migration path available
- Both old and new interfaces can coexist

## Migration Guide

### From Legacy Services

**Before (Legacy)**:
```typescript
@Injectable()
export class OldNotificationService {
  constructor(
    @Inject('IEmailService') private emailService: IEmailService,
  ) {}

  async sendEmail(to: string, subject: string, body: string) {
    return await this.emailService.sendEmail({
      to,
      subject,
      body,
    });
  }
}
```

**After (DDD)**:
```typescript
@Injectable()
export class NewNotificationService {
  constructor(
    private readonly messageOrchestration: MessageOrchestrationService,
  ) {}

  async sendEmail(to: string, subject: string, body: string) {
    const recipient = MessageRecipient.create('email', to);
    const content = MessageContent.create(body, subject);

    return await this.messageOrchestration.sendMessage({
      recipient,
      channel: 'email',
      content,
      priority: MessagePriority.NORMAL,
    });
  }
}
```

## Testing

The module includes comprehensive test coverage:

```typescript
// Example test
describe('MessageOrchestrationService', () => {
  let service: MessageOrchestrationService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessageOrchestrationService,
        // ... other providers
      ],
    }).compile();
    
    service = module.get<MessageOrchestrationService>(MessageOrchestrationService);
  });
  
  it('should send message successfully', async () => {
    const recipient = MessageRecipient.create('email', 'test@example.com');
    const content = MessageContent.create('Test message', 'Test Subject');
    
    const request = {
      recipient,
      channel: 'email',
      content,
      priority: MessagePriority.NORMAL,
    };
    
    const result = await service.sendMessage(request);
    expect(result.status).toBe('sent');
  });
});
```

## Contributing

When contributing to this module:

1. Follow DDD principles
2. Maintain backward compatibility
3. Add comprehensive tests
4. Update documentation
5. Follow the established patterns

## Performance Considerations

- **Connection Pooling**: SMTP connections are pooled
- **Rate Limiting**: Prevents API quota exhaustion
- **Batch Processing**: Efficient bulk operations
- **Async Processing**: Non-blocking message sending
- **Retry Strategies**: Exponential backoff for failed messages
- **Health Monitoring**: Proactive issue detection

This DDD implementation provides a robust, scalable, and maintainable communication system that can grow with your application's needs.