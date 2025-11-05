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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../../auth/infrastructure/guards/jwt-auth.guard");
const user_service_1 = require("../../application/services/user.service");
const update_profile_dto_1 = require("../../application/dtos/request/update-profile.dto");
const role_management_dto_1 = require("../../application/dtos/request/role-management.dto");
const address_dto_1 = require("../../application/dtos/request/address.dto");
const device_dto_1 = require("../../application/dtos/request/device.dto");
const user_profile_response_dto_1 = require("../../application/dtos/response/user-profile.response.dto");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async getProfile(req) {
        return this.userService.getUserProfile(req.user.userId);
    }
    async updateProfile(req, dto) {
        return this.userService.updateProfile(req.user.userId, dto);
    }
    async getRoles(req) {
        return this.userService.getUserRoles(req.user.userId);
    }
    async switchRole(req, dto) {
        return this.userService.switchRole(req.user.userId, dto);
    }
    async registerRole(req, dto) {
        return this.userService.registerRole(req.user.userId, dto);
    }
    async changePassword(req, dto) {
        await this.userService.changePassword(req.user.userId, dto);
        return { success: true, message: 'Password changed successfully' };
    }
    async uploadProfileImage(req, dto, file) {
        const imageUrl = dto.imageUrl || 'https://cdn.example.com/default-avatar.jpg';
        return this.userService.uploadProfileImage(req.user.userId, imageUrl);
    }
    async createAddress(req, dto) {
        const address = await this.userService.createAddress(req.user.userId, dto);
        return { success: true, data: { address } };
    }
    async updateAddress(req, addressId, dto) {
        const address = await this.userService.updateAddress(req.user.userId, addressId, dto);
        return {
            success: true,
            message: 'Address updated successfully',
            data: { address },
        };
    }
    async deleteAddress(req, addressId) {
        await this.userService.deleteAddress(req.user.userId, addressId);
        return { success: true, message: 'Address deleted successfully' };
    }
    async getAddresses(req) {
        const addresses = await this.userService.getAddresses(req.user.userId);
        return { success: true, data: { addresses } };
    }
    async setDefaultAddress(req, addressId) {
        const result = await this.userService.setDefaultAddress(req.user.userId, addressId);
        return { success: true, data: result };
    }
    async getDefaultAddress(req) {
        const address = await this.userService.getDefaultAddress(req.user.userId);
        return { success: true, data: { address } };
    }
    async registerPushToken(req, dto) {
        const result = await this.userService.registerPushToken(req.user.userId, dto);
        return { success: true, data: result };
    }
    async getDevices(req) {
        const devices = await this.userService.getDevices(req.user.userId);
        return { success: true, data: { devices } };
    }
    async deleteDevice(req, deviceId) {
        await this.userService.deleteDevice(req.user.userId, deviceId);
        return { success: true, message: 'Device deleted successfully' };
    }
    async getPreferences(req) {
        const preferences = await this.userService.getPreferences(req.user.userId);
        return { success: true, data: preferences };
    }
    async updatePreferences(req, preferences) {
        const updated = await this.userService.updatePreferences(req.user.userId, preferences);
        return { success: true, data: updated };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get authenticated user profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User profile retrieved',
        type: user_profile_response_dto_1.UserProfileResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Profile updated',
        type: user_profile_response_dto_1.UserProfileResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user roles' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User roles retrieved',
        type: user_profile_response_dto_1.UserRolesResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)('switch-role'),
    (0, swagger_1.ApiOperation)({ summary: 'Switch to a different role' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role switched successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid role or missing verification',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Role not registered' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, role_management_dto_1.SwitchRoleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "switchRole", null);
__decorate([
    (0, common_1.Post)('register-role'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new role for the user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Role registered successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Verification required or invalid OTP',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Role already active' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, role_management_dto_1.RegisterRoleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "registerRole", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Change user password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Weak password' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid current password' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('upload-profile-image'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload profile image' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data', 'application/json'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile image uploaded' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UploadProfileImageDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "uploadProfileImage", null);
__decorate([
    (0, common_1.Post)('addresses'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new address' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Address created',
        type: user_profile_response_dto_1.AddressResponseDto,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, address_dto_1.CreateAddressDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createAddress", null);
__decorate([
    (0, common_1.Put)('addresses/:addressId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an address' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Address updated',
        type: user_profile_response_dto_1.AddressResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Address not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('addressId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, address_dto_1.UpdateAddressDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Delete)('addresses/:addressId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Address deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Address not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('addressId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Get)('addresses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all user addresses' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Addresses retrieved',
        type: [user_profile_response_dto_1.AddressResponseDto],
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAddresses", null);
__decorate([
    (0, common_1.Post)('addresses/:addressId/default'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Set address as default' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Default address set' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Address not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('addressId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "setDefaultAddress", null);
__decorate([
    (0, common_1.Get)('addresses/default'),
    (0, swagger_1.ApiOperation)({ summary: 'Get default address' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Default address retrieved',
        type: user_profile_response_dto_1.AddressResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No default address set' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getDefaultAddress", null);
__decorate([
    (0, common_1.Post)('push-tokens'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register push token for notifications' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Push token registered' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, device_dto_1.RegisterPushTokenDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "registerPushToken", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user devices' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Devices retrieved',
        type: [user_profile_response_dto_1.DeviceResponseDto],
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Delete)('devices/:deviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete device and revoke push token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Device not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteDevice", null);
__decorate([
    (0, common_1.Get)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferences retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferences updated' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePreferences", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map