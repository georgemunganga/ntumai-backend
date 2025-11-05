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
exports.RegisterResponseDto = exports.OtpVerifyNewUserResponseDto = exports.OtpVerifyExistingUserResponseDto = exports.OtpRequestResponseDto = exports.TokensResponseDto = exports.UserResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserResponseDto {
    id;
    email;
    phone;
    firstName;
    lastName;
    role;
    isEmailVerified;
    isPhoneVerified;
    createdAt;
    updatedAt;
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clh7x9k2l0000qh8v4g2m1n3p' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+260972827372', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'CUSTOMER' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isEmailVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isPhoneVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-10T10:30:00Z' }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:30:00Z' }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
class TokensResponseDto {
    accessToken;
    refreshToken;
    expiresIn;
    tokenType = 'Bearer';
}
exports.TokensResponseDto = TokensResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    __metadata("design:type", String)
], TokensResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    __metadata("design:type", String)
], TokensResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3600 }),
    __metadata("design:type", Number)
], TokensResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bearer', default: 'Bearer' }),
    __metadata("design:type", String)
], TokensResponseDto.prototype, "tokenType", void 0);
class OtpRequestResponseDto {
    challengeId;
    expiresAt;
    resendAvailableAt;
    attemptsAllowed;
}
exports.OtpRequestResponseDto = OtpRequestResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e' }),
    __metadata("design:type", String)
], OtpRequestResponseDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:35:00Z' }),
    __metadata("design:type", Date)
], OtpRequestResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15T10:31:00Z' }),
    __metadata("design:type", Date)
], OtpRequestResponseDto.prototype, "resendAvailableAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], OtpRequestResponseDto.prototype, "attemptsAllowed", void 0);
class OtpVerifyExistingUserResponseDto {
    user;
    tokens;
}
exports.OtpVerifyExistingUserResponseDto = OtpVerifyExistingUserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], OtpVerifyExistingUserResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TokensResponseDto }),
    __metadata("design:type", TokensResponseDto)
], OtpVerifyExistingUserResponseDto.prototype, "tokens", void 0);
class OtpVerifyNewUserResponseDto {
    registrationToken;
    expiresIn;
}
exports.OtpVerifyNewUserResponseDto = OtpVerifyNewUserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    __metadata("design:type", String)
], OtpVerifyNewUserResponseDto.prototype, "registrationToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 600 }),
    __metadata("design:type", Number)
], OtpVerifyNewUserResponseDto.prototype, "expiresIn", void 0);
class RegisterResponseDto {
    user;
    tokens;
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], RegisterResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TokensResponseDto }),
    __metadata("design:type", TokensResponseDto)
], RegisterResponseDto.prototype, "tokens", void 0);
//# sourceMappingURL=user-response.dto.js.map