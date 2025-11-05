"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CommunicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsService = exports.CommunicationChannel = void 0;
const common_1 = require("@nestjs/common");
const email_provider_1 = require("../../infrastructure/providers/email.provider");
const sms_provider_1 = require("../../infrastructure/providers/sms.provider");
var CommunicationChannel;
(function (CommunicationChannel) {
    CommunicationChannel["EMAIL"] = "email";
    CommunicationChannel["SMS"] = "sms";
    CommunicationChannel["PUSH"] = "push";
    CommunicationChannel["IN_APP"] = "in_app";
})(CommunicationChannel || (exports.CommunicationChannel = CommunicationChannel = {}));
let CommunicationsService = CommunicationsService_1 = class CommunicationsService {
    emailProvider;
    smsProvider;
    logger = new common_1.Logger(CommunicationsService_1.name);
    constructor(emailProvider, smsProvider) {
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
    }
    async sendMessage(options) {
        try {
            switch (options.channel) {
                case CommunicationChannel.EMAIL:
                    return await this.sendEmailMessage(options);
                case CommunicationChannel.SMS:
                    return await this.sendSmsMessage(options);
                case CommunicationChannel.PUSH:
                    this.logger.warn('Push notifications not yet implemented');
                    return false;
                case CommunicationChannel.IN_APP:
                    this.logger.warn('In-app notifications not yet implemented');
                    return false;
                default:
                    throw new Error(`Unsupported communication channel: ${options.channel}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send message via ${options.channel}:`, error);
            throw error;
        }
    }
    async sendEmailMessage(options) {
        if (options.template) {
            await this.emailProvider.sendEmail({
                to: options.recipient,
                subject: options.subject || 'Notification from Ntumai',
                template: options.template,
                context: options.context,
            });
        }
        else {
            await this.emailProvider.sendEmail({
                to: options.recipient,
                subject: options.subject || 'Notification from Ntumai',
                html: options.message,
            });
        }
        return true;
    }
    async sendSmsMessage(options) {
        await this.smsProvider.sendSms({
            to: options.recipient,
            message: options.message || '',
        });
        return true;
    }
    async sendOtp(channel, recipient, otp, purpose = 'verify') {
        if (channel === CommunicationChannel.EMAIL) {
            await this.emailProvider.sendOtpEmail(recipient, otp, purpose);
        }
        else if (channel === CommunicationChannel.SMS) {
            await this.smsProvider.sendOtpSms(recipient, otp);
        }
    }
    async sendWelcome(email, firstName) {
        await this.emailProvider.sendWelcomeEmail(email, firstName);
    }
    async sendPasswordReset(channel, recipient, otp) {
        if (channel === CommunicationChannel.EMAIL) {
            await this.emailProvider.sendPasswordResetEmail(recipient, otp);
        }
        else if (channel === CommunicationChannel.SMS) {
            await this.smsProvider.sendPasswordResetSms(recipient, otp);
        }
    }
    async sendOrderConfirmation(email, orderDetails) {
        await this.emailProvider.sendOrderConfirmationEmail(email, orderDetails);
    }
    async sendDeliveryNotification(channel, recipient, deliveryDetails) {
        if (channel === CommunicationChannel.EMAIL) {
            await this.emailProvider.sendDeliveryNotificationEmail(recipient, deliveryDetails);
        }
        else if (channel === CommunicationChannel.SMS) {
            await this.smsProvider.sendDeliveryNotificationSms(recipient, deliveryDetails.status);
        }
    }
    async sendMultiChannel(channels, recipient, options) {
        const promises = channels.map((channel) => this.sendMessage({
            channel,
            recipient,
            ...options,
        }));
        await Promise.allSettled(promises);
    }
};
exports.CommunicationsService = CommunicationsService;
exports.CommunicationsService = CommunicationsService = CommunicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_provider_1.EmailProvider,
        sms_provider_1.SmsProvider])
], CommunicationsService);
//# sourceMappingURL=communications.service.js.map