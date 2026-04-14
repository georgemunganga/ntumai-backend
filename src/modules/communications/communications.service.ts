import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  text?: string;
  html?: string;
  from?: string;
}

interface EmailDetailItem {
  label: string;
  value: string;
}

interface EmailAction {
  ctaLabel?: string;
  ctaUrl?: string;
  preheader?: string;
}

type WelcomeRole = 'customer' | 'tasker' | 'vendor';

interface OrderConfirmationEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  orderId: string;
  deliveryAddress: string;
  total: string;
  itemCount?: number;
  estimatedArrival?: string;
}

interface VendorNewOrderEmailInput extends EmailAction {
  to: string;
  storeName?: string;
  orderId: string;
  itemCount: number;
  total: string;
  customerName?: string;
  preparationDeadline?: string;
}

interface TaskerAssignedEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  orderId: string;
  taskerName: string;
  taskerPhone?: string;
  eta?: string;
}

interface DeliveryCompletedEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  orderId: string;
  deliveredAt?: string;
  deliveryAddress?: string;
  total?: string;
}

interface PaymentSuccessEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  paymentId: string;
  amount: string;
  paidAt: string;
  orderId?: string;
  method?: string;
}

interface NewJobAvailableEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  jobId: string;
  jobType: string;
  pickupAddress: string;
  dropoffAddress?: string;
  payout: string;
  etaToPickup?: string;
}

interface WelcomeByRoleEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  role: WelcomeRole;
}

interface LoginAlertEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  deviceId?: string;
  occurredAt?: string;
  identifier?: string;
}

interface SuspiciousActivityEmailInput extends EmailAction {
  to: string;
  firstName?: string;
  reason: string;
  occurredAt?: string;
  identifier?: string;
  recommendedAction?: string;
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private templatesCache = new Map<string, HandlebarsTemplateDelegate>();
  private partialsRegistered = false;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templateDir = this.getTemplateDir();
    if (fs.existsSync(templateDir)) {
      const templates = fs.readdirSync(templateDir);
      this.logger.log(`Found ${templates.length} email templates`);
    }
    this.registerPartials();
  }

  private getTemplateDir(): string {
    const candidates = [
      path.join(__dirname, 'infrastructure', 'templates'),
      path.join(
        process.cwd(),
        'dist',
        'src',
        'modules',
        'communications',
        'infrastructure',
        'templates',
      ),
      path.join(
        process.cwd(),
        'dist',
        'modules',
        'communications',
        'infrastructure',
        'templates',
      ),
      path.join(
        process.cwd(),
        'src',
        'modules',
        'communications',
        'infrastructure',
        'templates',
      ),
    ];

    const templateDir = candidates.find((candidate) => fs.existsSync(candidate));

    if (!templateDir) {
      this.logger.warn(
        `Email template directory not found. Checked: ${candidates.join(', ')}`,
      );
      return candidates[0];
    }

    return templateDir;
  }

  private registerPartials(): void {
    if (this.partialsRegistered) {
      return;
    }

    const partialsDir = path.join(this.getTemplateDir(), 'partials');

    if (!fs.existsSync(partialsDir)) {
      return;
    }

    const partialFiles = fs
      .readdirSync(partialsDir)
      .filter((file) => file.endsWith('.hbs'));

    for (const partialFile of partialFiles) {
      const partialName = path.basename(partialFile, '.hbs');
      const partialSource = fs.readFileSync(
        path.join(partialsDir, partialFile),
        'utf-8',
      );
      handlebars.registerPartial(partialName, partialSource);
    }

    this.partialsRegistered = true;
    this.logger.log(`Registered ${partialFiles.length} email partials`);
  }

  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    this.registerPartials();

    // Check cache first
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    // Load template from file
    const templatePath = path.join(this.getTemplateDir(), `${templateName}.hbs`);

    if (!fs.existsSync(templatePath)) {
      this.logger.warn(`Template not found: ${templateName}`);
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // Cache the compiled template
    this.templatesCache.set(templateName, template);
    return template;
  }

  private buildDetails(
    entries: Array<[label: string, value: string | number | undefined | null]>,
  ): EmailDetailItem[] {
    return entries
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([label, value]) => ({
        label,
        value: String(value),
      }));
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from =
        options.from ||
        this.configService.get<string>(
          'MAIL_FROM_ADDRESS',
          this.configService.get<string>('MAIL_FROM', 'ntumai@greenwebb.tech'),
        );

      let html = options.html;

      // If template is specified, render it
      if (options.template) {
        this.logger.debug(`Rendering template: ${options.template}`);
        const template = this.getTemplate(options.template);
        const layout = this.getTemplate('layout');
        const appName =
          this.configService.get<string>('APP_NAME') || 'Ntumai Admin';
        const supportEmail =
          this.configService.get<string>(
            'SUPPORT_EMAIL',
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
              this.configService.get<string>('MAIL_FROM') ||
              'support@greenwebb.tech',
          );
        const baseContext = {
          ...options.context,
          year: new Date().getFullYear(),
          appUrl: this.configService.get<string>(
            'APP_URL',
            'http://localhost:3000',
          ),
          appName,
          supportEmail,
          companyName: 'Ntumai',
          companyUrl: this.configService.get<string>(
            'COMPANY_URL',
            'https://greenwebb.tech',
          ),
          brandPrimary: '#2563eb',
          brandPrimaryDark: '#1d4ed8',
          brandAccent: '#eff6ff',
          fontFamily:
            "'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        };
        const body = template(baseContext);
        html = layout({
          ...baseContext,
          body,
          emailTitle: options.subject,
          preheader:
            options.context?.preheader || options.subject || 'Ntumai update',
        });
        this.logger.debug(`Template rendered successfully`);
      }

      this.logger.log(`Attempting to send email to ${options.to} with subject: ${options.subject}`);
      
      // Send email using MailerService
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html,
        from,
      });

      this.logger.log(`✅ Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error.stack || error.message || error);
      throw error;
    }
  }

  async sendOtp(
    to: string,
    otp: string,
    purpose: string = 'verify',
  ): Promise<void> {
    const otpTtl = this.configService.get<number>('OTP_TTL', 600);
    const expiryMinutes = Math.ceil(otpTtl / 60);

    await this.sendEmail({
      to,
      subject: `Your Ntumai Verification Code: ${otp}`,
      template: 'otp-email',
      context: {
        otp,
        purpose,
        expiryMinutes,
      },
    });
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Ntumai! 🎉',
      template: 'welcome-email',
      context: {
        firstName,
      },
    });
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<void> {
    const otpTtl = this.configService.get<number>('OTP_TTL', 600);
    const expiryMinutes = Math.ceil(otpTtl / 60);

    await this.sendEmail({
      to,
      subject: 'Password Reset Request - Ntumai',
      template: 'password-reset-email',
      context: {
        otp,
        expiryMinutes,
      },
    });
  }

  async sendNotification(
    to: string,
    title: string,
    body: string,
  ): Promise<void> {
    // In a real application, this would use a service like Firebase Cloud Messaging (FCM)
    // For now, we simulate by sending an email
    const subject = `Ntumai Notification: ${title}`;
    const text = body;
    const html = `<p><strong>${title}</strong></p><p>${body}</p>`;

    // Assuming 'to' is an email address for this simulation
    await this.sendEmail({ to, subject, text, html });
  }

  async sendWelcomeEmailByRole(
    input: WelcomeByRoleEmailInput,
  ): Promise<void> {
    const templateByRole: Record<WelcomeRole, string> = {
      customer: 'welcome-customer-email',
      tasker: 'welcome-tasker-email',
      vendor: 'welcome-vendor-email',
    };

    await this.sendEmail({
      to: input.to,
      subject: 'Welcome to Ntumai',
      template: templateByRole[input.role] || 'welcome-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          'Your account is ready and you can continue in the app.',
        ctaLabel: input.ctaLabel || 'Open Ntumai',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendLoginAlertEmail(input: LoginAlertEmailInput): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: 'New login detected',
      template: 'login-alert-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          'We noticed a new sign-in to your account.',
        details: this.buildDetails([
          ['Account', input.identifier],
          ['Device ID', input.deviceId],
          ['Occurred At', input.occurredAt],
        ]),
        ctaLabel: input.ctaLabel || 'Review Account',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendSuspiciousActivityAlertEmail(
    input: SuspiciousActivityEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: 'Suspicious activity detected',
      template: 'suspicious-activity-alert-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          'We found account activity that needs your attention.',
        details: this.buildDetails([
          ['Reason', input.reason],
          ['Account', input.identifier],
          ['Occurred At', input.occurredAt],
          ['Recommended Action', input.recommendedAction],
        ]),
        ctaLabel: input.ctaLabel || 'Secure Account',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendOrderConfirmationEmail(
    input: OrderConfirmationEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `Order confirmed: ${input.orderId}`,
      template: 'order-confirmation-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          `Your order ${input.orderId} has been confirmed and is being processed.`,
        details: this.buildDetails([
          ['Order ID', input.orderId],
          ['Delivery Address', input.deliveryAddress],
          ['Total', input.total],
          ['Items', input.itemCount],
          ['Estimated Arrival', input.estimatedArrival],
        ]),
        ctaLabel: input.ctaLabel || 'Track Your Order',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendVendorNewOrderEmail(
    input: VendorNewOrderEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `New order received: ${input.orderId}`,
      template: 'vendor-new-order-email',
      context: {
        storeName: input.storeName,
        preheader:
          input.preheader ||
          `A new customer order ${input.orderId} is waiting for vendor action.`,
        details: this.buildDetails([
          ['Order ID', input.orderId],
          ['Items', input.itemCount],
          ['Order Value', input.total],
          ['Customer', input.customerName],
          ['Preparation Deadline', input.preparationDeadline],
        ]),
        ctaLabel: input.ctaLabel || 'Accept Order',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendTaskerAssignedEmail(
    input: TaskerAssignedEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `Tasker assigned for order ${input.orderId}`,
      template: 'tasker-assigned-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          `A rider or tasker has been assigned to order ${input.orderId}.`,
        details: this.buildDetails([
          ['Order ID', input.orderId],
          ['Tasker', input.taskerName],
          ['Phone', input.taskerPhone],
          ['ETA', input.eta],
        ]),
        ctaLabel: input.ctaLabel || 'Track Live Location',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendDeliveryCompletedEmail(
    input: DeliveryCompletedEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `Delivery completed: ${input.orderId}`,
      template: 'delivery-completed-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          `Order ${input.orderId} has been delivered successfully.`,
        details: this.buildDetails([
          ['Order ID', input.orderId],
          ['Delivered At', input.deliveredAt],
          ['Delivery Address', input.deliveryAddress],
          ['Total', input.total],
        ]),
        ctaLabel: input.ctaLabel || 'View Order',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendPaymentSuccessEmail(
    input: PaymentSuccessEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `Payment received: ${input.amount}`,
      template: 'payment-success-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          `Payment ${input.paymentId} was processed successfully.`,
        details: this.buildDetails([
          ['Payment ID', input.paymentId],
          ['Amount', input.amount],
          ['Paid At', input.paidAt],
          ['Order ID', input.orderId],
          ['Method', input.method],
        ]),
        ctaLabel: input.ctaLabel || 'View Receipt',
        ctaUrl: input.ctaUrl,
      },
    });
  }

  async sendNewJobAvailableEmail(
    input: NewJobAvailableEmailInput,
  ): Promise<void> {
    await this.sendEmail({
      to: input.to,
      subject: `New ${input.jobType} job available`,
      template: 'new-job-available-email',
      context: {
        firstName: input.firstName,
        preheader:
          input.preheader ||
          `A nearby ${input.jobType} job ${input.jobId} is available now.`,
        details: this.buildDetails([
          ['Job ID', input.jobId],
          ['Job Type', input.jobType],
          ['Pickup Address', input.pickupAddress],
          ['Dropoff Address', input.dropoffAddress],
          ['Payout', input.payout],
          ['ETA To Pickup', input.etaToPickup],
        ]),
        ctaLabel: input.ctaLabel || 'View Job',
        ctaUrl: input.ctaUrl,
      },
    });
  }
}
