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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const sms_provider_1 = require("../../../communications/infrastructure/providers/sms.provider");
let SmsService = SmsService_1 = class SmsService {
    smsProvider;
    logger = new common_1.Logger(SmsService_1.name);
    constructor(smsProvider) {
        this.smsProvider = smsProvider;
    }
    async sendOtp(phone, otp) {
        try {
            await this.smsProvider.sendOtpSms(phone, otp);
            this.logger.log(`OTP SMS sent to ${phone}`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP SMS to ${phone}`, error);
            throw error;
        }
    }
    async sendPasswordResetOtp(phone, otp) {
        try {
            await this.smsProvider.sendPasswordResetSms(phone, otp);
            this.logger.log(`Password reset OTP SMS sent to ${phone}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset OTP SMS to ${phone}`, error);
            throw error;
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sms_provider_1.SmsProvider])
], SmsService);
//# sourceMappingURL=sms.service.js.map