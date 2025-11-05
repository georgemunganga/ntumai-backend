"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpChallengeEntity = void 0;
const common_1 = require("@nestjs/common");
class OtpChallengeEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get challengeId() {
        return this.props.challengeId;
    }
    get identifier() {
        return this.props.identifier;
    }
    get identifierType() {
        return this.props.identifierType;
    }
    get otpCodeHash() {
        return this.props.otpCodeHash;
    }
    get purpose() {
        return this.props.purpose;
    }
    get attempts() {
        return this.props.attempts;
    }
    get maxAttempts() {
        return this.props.maxAttempts;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get resendAvailableAt() {
        return this.props.resendAvailableAt;
    }
    get isVerified() {
        return this.props.isVerified;
    }
    get verifiedAt() {
        return this.props.verifiedAt;
    }
    get ipAddress() {
        return this.props.ipAddress;
    }
    get userAgent() {
        return this.props.userAgent;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    isExpired() {
        return new Date() > this.props.expiresAt;
    }
    canResend() {
        return new Date() >= this.props.resendAvailableAt;
    }
    hasAttemptsLeft() {
        return this.props.attempts < this.props.maxAttempts;
    }
    incrementAttempts() {
        if (!this.hasAttemptsLeft()) {
            throw new common_1.BadRequestException('Maximum OTP attempts exceeded');
        }
        this.props.attempts += 1;
    }
    async verify(otpCode) {
        if (this.isExpired()) {
            throw new common_1.BadRequestException('OTP has expired');
        }
        if (!this.hasAttemptsLeft()) {
            throw new common_1.BadRequestException('Maximum OTP attempts exceeded');
        }
        this.incrementAttempts();
        const isValid = await otpCode.verify(this.props.otpCodeHash);
        if (isValid) {
            this.markAsVerified();
        }
        return isValid;
    }
    markAsVerified() {
        this.props.isVerified = true;
        this.props.verifiedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            challengeId: this.challengeId,
            identifier: this.identifier,
            identifierType: this.identifierType,
            purpose: this.purpose,
            attempts: this.attempts,
            maxAttempts: this.maxAttempts,
            expiresAt: this.expiresAt,
            resendAvailableAt: this.resendAvailableAt,
            isVerified: this.isVerified,
            verifiedAt: this.verifiedAt,
            createdAt: this.createdAt,
        };
    }
}
exports.OtpChallengeEntity = OtpChallengeEntity;
//# sourceMappingURL=otp-challenge.entity.js.map