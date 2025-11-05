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
exports.DeviceResponseDto = exports.AddressResponseDto = exports.UserRolesResponseDto = exports.RoleInfoDto = exports.UserProfileResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserProfileResponseDto {
    id;
    email;
    phone;
    firstName;
    lastName;
    profileImage;
    currentRole;
    roles;
    profileComplete;
    createdAt;
    updatedAt;
}
exports.UserProfileResponseDto = UserProfileResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'clh7x9k2l0000qh8v4g2m1n3p' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', required: false }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+260972827372', required: false }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Doe' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://cdn.example.com/avatar.jpg',
        required: false,
    }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "profileImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'CUSTOMER' }),
    __metadata("design:type", String)
], UserProfileResponseDto.prototype, "currentRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.UserRole,
        isArray: true,
        example: ['CUSTOMER', 'VENDOR'],
    }),
    __metadata("design:type", Array)
], UserProfileResponseDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserProfileResponseDto.prototype, "profileComplete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-10T10:30:00Z' }),
    __metadata("design:type", Date)
], UserProfileResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-10-19T10:30:00Z' }),
    __metadata("design:type", Date)
], UserProfileResponseDto.prototype, "updatedAt", void 0);
class RoleInfoDto {
    role;
    active;
}
exports.RoleInfoDto = RoleInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'CUSTOMER' }),
    __metadata("design:type", String)
], RoleInfoDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], RoleInfoDto.prototype, "active", void 0);
class UserRolesResponseDto {
    currentRole;
    roles;
}
exports.UserRolesResponseDto = UserRolesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'CUSTOMER' }),
    __metadata("design:type", String)
], UserRolesResponseDto.prototype, "currentRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RoleInfoDto] }),
    __metadata("design:type", Array)
], UserRolesResponseDto.prototype, "roles", void 0);
class AddressResponseDto {
    id;
    type;
    label;
    address;
    city;
    state;
    country;
    postalCode;
    latitude;
    longitude;
    instructions;
    contactName;
    contactPhone;
    isDefault;
    createdAt;
    updatedAt;
}
exports.AddressResponseDto = AddressResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'addr_abc123' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'home' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Home', required: false }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Plot 10, Addis Ababa Dr' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Lusaka' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Lusaka' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ZM' }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10101', required: false }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -15.3875 }),
    __metadata("design:type", Number)
], AddressResponseDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.3228 }),
    __metadata("design:type", Number)
], AddressResponseDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Call when at the gate', required: false }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "instructions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', required: false }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+260972827372', required: false }),
    __metadata("design:type", String)
], AddressResponseDto.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AddressResponseDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-10-19T12:00:00Z' }),
    __metadata("design:type", Date)
], AddressResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-10-19T12:00:00Z' }),
    __metadata("design:type", Date)
], AddressResponseDto.prototype, "updatedAt", void 0);
class DeviceResponseDto {
    deviceId;
    platform;
    lastSeen;
}
exports.DeviceResponseDto = DeviceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'android_123' }),
    __metadata("design:type", String)
], DeviceResponseDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'android' }),
    __metadata("design:type", String)
], DeviceResponseDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-10-19T12:01:00Z' }),
    __metadata("design:type", Date)
], DeviceResponseDto.prototype, "lastSeen", void 0);
//# sourceMappingURL=user-profile.response.dto.js.map