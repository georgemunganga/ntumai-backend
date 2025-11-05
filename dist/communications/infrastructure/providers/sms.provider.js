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
var SmsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsProvider = SmsProvider_1 = class SmsProvider {
    configService;
    logger = new common_1.Logger(SmsProvider_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async sendSms(options) {
        const apiKey = this.configService.get('SMS_API_KEY');
        const apiUrl = this.configService.get('SMS_API_URL');
        if (!apiKey || !apiUrl) {
            this.logger.warn('SMS configuration is incomplete. SMS sending will be simulated.');
            this.logger.log(`[SIMULATED] SMS sent to: ${options.to}`);
            this.logger.log(`[SIMULATED] Message: ${options.message}`);
            return true;
        }
        try {
            this.logger.log(`[SIMULATED] SMS sent to ${options.to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${options.to}:`, error);
            throw error;
        }
    }
    async sendOtpSms(phone, otp) {
        const message = `Your Ntumai verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
        await this.sendSms({ to: phone, message });
    }
    async sendPasswordResetSms(phone, otp) {
        const message = `Your Ntumai password reset code is: ${otp}. Valid for 10 minutes.`;
        await this.sendSms({ to: phone, message });
    }
    async sendDeliveryNotificationSms(phone, status) {
        const message = `Ntumai Delivery Update: ${status}`;
        await this.sendSms({ to: phone, message });
    }
};
exports.SmsProvider = SmsProvider;
exports.SmsProvider = SmsProvider = SmsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsProvider);
//# sourceMappingURL=sms.provider.js.map