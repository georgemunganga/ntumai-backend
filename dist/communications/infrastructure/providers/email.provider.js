"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EmailProvider = EmailProvider_1 = class EmailProvider {
    configService;
    logger = new common_1.Logger(EmailProvider_1.name);
    transporter;
    templatesCache = new Map();
    constructor(configService) {
        this.configService = configService;
        this.initializeTransporter();
    }
    initializeTransporter() {
        const host = this.configService.get('SMTP_HOST');
        const port = this.configService.get('SMTP_PORT');
        const secure = this.configService.get('SMTP_SECURE', true);
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        if (!host || !user || !pass) {
            this.logger.warn('SMTP configuration is incomplete. Email sending will be simulated.');
            return;
        }
        try {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
            this.logger.log(`Email provider initialized with host: ${host}`);
            this.transporter.verify((error, success) => {
                if (error) {
                    this.logger.error('SMTP connection verification failed:', error);
                }
                else {
                    this.logger.log('SMTP connection verified successfully');
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize email transporter:', error);
        }
    }
    getTemplate(templateName) {
        if (this.templatesCache.has(templateName)) {
            return this.templatesCache.get(templateName);
        }
        const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateName}`);
        }
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        this.templatesCache.set(templateName, template);
        return template;
    }
    async sendEmail(options) {
        try {
            const from = options.from ||
                this.configService.get('SMTP_FROM', 'ntumai@greenwebb.tech');
            let html = options.html;
            const text = options.text;
            if (options.template) {
                const template = this.getTemplate(options.template);
                const context = {
                    ...options.context,
                    year: new Date().getFullYear(),
                    appUrl: this.configService.get('APP_URL', 'http://localhost:3000'),
                };
                html = template(context);
            }
            if (!this.transporter) {
                this.logger.log(`[SIMULATED] Email sent to: ${options.to}`);
                this.logger.log(`[SIMULATED] Subject: ${options.subject}`);
                if (options.template) {
                    this.logger.log(`[SIMULATED] Template: ${options.template}`);
                }
                return true;
            }
            const info = await this.transporter.sendMail({
                from: `"Ntumai" <${from}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text,
                html,
            });
            this.logger.log(`Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error);
            throw error;
        }
    }
    async sendOtpEmail(email, otp, purpose = 'verify') {
        const expiryMinutes = this.configService.get('OTP_TTL', 600) / 60;
        await this.sendEmail({
            to: email,
            subject: `Your Ntumai Verification Code: ${otp}`,
            template: 'otp-email',
            context: {
                otp,
                purpose,
                expiryMinutes,
            },
        });
    }
    async sendWelcomeEmail(email, firstName) {
        await this.sendEmail({
            to: email,
            subject: 'Welcome to Ntumai! 🎉',
            template: 'welcome-email',
            context: {
                firstName,
            },
        });
    }
    async sendPasswordResetEmail(email, otp) {
        const expiryMinutes = this.configService.get('OTP_TTL', 600) / 60;
        await this.sendEmail({
            to: email,
            subject: 'Password Reset Request - Ntumai',
            template: 'password-reset-email',
            context: {
                otp,
                expiryMinutes,
            },
        });
    }
    async sendOrderConfirmationEmail(email, orderDetails) {
        await this.sendEmail({
            to: email,
            subject: `Order Confirmation #${orderDetails.orderId}`,
            html: `<p>Your order has been confirmed. Order ID: ${orderDetails.orderId}</p>`,
        });
    }
    async sendDeliveryNotificationEmail(email, deliveryDetails) {
        await this.sendEmail({
            to: email,
            subject: `Delivery Update - ${deliveryDetails.status}`,
            html: `<p>Your delivery status: ${deliveryDetails.status}</p>`,
        });
    }
};
exports.EmailProvider = EmailProvider;
exports.EmailProvider = EmailProvider = EmailProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailProvider);
//# sourceMappingURL=email.provider.js.map