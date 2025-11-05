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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const email_provider_1 = require("../../../communications/infrastructure/providers/email.provider");
let EmailService = EmailService_1 = class EmailService {
    emailProvider;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(emailProvider) {
        this.emailProvider = emailProvider;
    }
    async sendOtp(email, otp) {
        try {
            await this.emailProvider.sendOtpEmail(email, otp, 'verify');
            this.logger.log(`OTP email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP email to ${email}`, error);
            throw error;
        }
    }
    async sendPasswordResetOtp(email, otp) {
        try {
            await this.emailProvider.sendPasswordResetEmail(email, otp);
            this.logger.log(`Password reset OTP email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset OTP email to ${email}`, error);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_provider_1.EmailProvider])
], EmailService);
//# sourceMappingURL=email.service.js.map