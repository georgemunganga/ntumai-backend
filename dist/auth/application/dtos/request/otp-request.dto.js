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
exports.OtpRequestDto = exports.OtpPurposeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var OtpPurposeDto;
(function (OtpPurposeDto) {
    OtpPurposeDto["LOGIN"] = "login";
    OtpPurposeDto["REGISTER"] = "register";
    OtpPurposeDto["PASSWORD_RESET"] = "password_reset";
})(OtpPurposeDto || (exports.OtpPurposeDto = OtpPurposeDto = {}));
class OtpRequestDto {
    purpose;
    email;
    phone;
    countryCode;
}
exports.OtpRequestDto = OtpRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Purpose of the OTP request',
        enum: OtpPurposeDto,
        example: 'login',
    }),
    (0, class_validator_1.IsEnum)(OtpPurposeDto),
    __metadata("design:type", String)
], OtpRequestDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email address (use email OR phone, not both)',
        example: 'user@example.com',
    }),
    (0, class_validator_1.ValidateIf)((o) => !o.phone),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OtpRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Phone number (local/national part)',
        example: '972827372',
    }),
    (0, class_validator_1.ValidateIf)((o) => !o.email),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OtpRequestDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Country code with + prefix (required if phone is provided)',
        example: '+260',
    }),
    (0, class_validator_1.ValidateIf)((o) => !!o.phone),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OtpRequestDto.prototype, "countryCode", void 0);
//# sourceMappingURL=otp-request.dto.js.map