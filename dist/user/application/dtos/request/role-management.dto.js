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
exports.RegisterRoleDto = exports.SwitchRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class SwitchRoleDto {
    targetRole;
    otpCode;
    phoneNumber;
    email;
}
exports.SwitchRoleDto = SwitchRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'VENDOR' }),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], SwitchRoleDto.prototype, "targetRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123456' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwitchRoleDto.prototype, "otpCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+260972827372' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwitchRoleDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user@example.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SwitchRoleDto.prototype, "email", void 0);
class RegisterRoleDto {
    role;
    otpCode;
    challengeId;
    metadata;
}
exports.RegisterRoleDto = RegisterRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'DRIVER' }),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], RegisterRoleDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123456' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterRoleDto.prototype, "otpCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'a5c1d19e-...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterRoleDto.prototype, "challengeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { storeName: 'Tembo Fresh' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RegisterRoleDto.prototype, "metadata", void 0);
//# sourceMappingURL=role-management.dto.js.map