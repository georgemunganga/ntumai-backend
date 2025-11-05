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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpVerifyDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class OtpVerifyDto {
    challengeId;
    otp;
}
exports.OtpVerifyDto = OtpVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Challenge ID from OTP request response',
        example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OtpVerifyDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '6-digit OTP code',
        example: '123456',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], OtpVerifyDto.prototype, "otp", void 0);
//# sourceMappingURL=otp-verify.dto.js.map