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
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const otp_code_vo_1 = require("../../domain/value-objects/otp-code.vo");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
let OtpService = OtpService_1 = class OtpService {
    configService;
    emailService;
    smsService;
    logger = new common_1.Logger(OtpService_1.name);
    constructor(configService, emailService, smsService) {
        this.configService = configService;
        this.emailService = emailService;
        this.smsService = smsService;
    }
    generateOtp() {
        return otp_code_vo_1.OtpCode.generate();
    }
    async sendOtpViaEmail(email, otp) {
        try {
            await this.emailService.sendOtp(email, otp.getValue());
            this.logger.log(`OTP sent to email: ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP to email: ${email}`, error);
            throw error;
        }
    }
    async sendOtpViaSms(phone, otp) {
        try {
            await this.smsService.sendOtp(phone, otp.getValue());
            this.logger.log(`OTP sent to phone: ${phone}`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP to phone: ${phone}`, error);
            throw error;
        }
    }
    getOtpTtl() {
        return this.configService.get('otp.ttl') || 600;
    }
    getOtpResendDelay() {
        return this.configService.get('otp.resendDelay') || 60;
    }
    getOtpMaxAttempts() {
        return this.configService.get('otp.maxAttempts') || 5;
    }
    calculateExpiryDate() {
        const ttl = this.getOtpTtl();
        return new Date(Date.now() + ttl * 1000);
    }
    calculateResendDate() {
        const delay = this.getOtpResendDelay();
        return new Date(Date.now() + delay * 1000);
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_service_1.EmailService,
        sms_service_1.SmsService])
], OtpService);
//# sourceMappingURL=otp.service.js.map