"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../../shared/database/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                UserRoleAssignment: {
                    where: { active: true },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const roles = user.UserRoleAssignment.map((ra) => ra.role);
        const profileComplete = !!(user.firstName &&
            user.lastName &&
            (user.email || user.phone));
        return {
            id: user.id,
            email: user.email || undefined,
            phone: user.phone || undefined,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage || undefined,
            currentRole: user.role,
            roles: roles.length > 0 ? roles : [user.role],
            profileComplete,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async updateProfile(userId, dto) {
        const updateData = {};
        if (dto.firstName)
            updateData.firstName = dto.firstName;
        if (dto.lastName)
            updateData.lastName = dto.lastName;
        if (dto.avatarUrl)
            updateData.profileImage = dto.avatarUrl;
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
            include: {
                UserRoleAssignment: {
                    where: { active: true },
                },
            },
        });
        const roles = user.UserRoleAssignment.map((ra) => ra.role);
        const profileComplete = !!(user.firstName &&
            user.lastName &&
            (user.email || user.phone));
        return {
            id: user.id,
            email: user.email || undefined,
            phone: user.phone || undefined,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage || undefined,
            currentRole: user.role,
            roles: roles.length > 0 ? roles : [user.role],
            profileComplete,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async getUserRoles(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                UserRoleAssignment: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const allRoles = Object.values(client_1.UserRole);
        const roleAssignments = user.UserRoleAssignment;
        const roles = allRoles.map((role) => {
            const assignment = roleAssignments.find((ra) => ra.role === role);
            return {
                role,
                active: assignment ? assignment.active : false,
            };
        });
        return {
            currentRole: user.role,
            roles,
        };
    }
    async switchRole(userId, dto) {
        const roleAssignment = await this.prisma.userRoleAssignment.findUnique({
            where: {
                userId_role: {
                    userId,
                    role: dto.targetRole,
                },
            },
        });
        if (!roleAssignment) {
            throw new common_1.ConflictException('Role not registered');
        }
        if (!roleAssignment.active) {
            throw new common_1.BadRequestException('Role is not active');
        }
        if ((dto.targetRole === 'VENDOR' || dto.targetRole === 'DRIVER') &&
            dto.otpCode) {
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                role: dto.targetRole,
                updatedAt: new Date(),
            },
        });
        return { currentRole: dto.targetRole };
    }
    async registerRole(userId, dto) {
        const existing = await this.prisma.userRoleAssignment.findUnique({
            where: {
                userId_role: {
                    userId,
                    role: dto.role,
                },
            },
        });
        if (existing && existing.active) {
            throw new common_1.ConflictException('Role already active');
        }
        if ((dto.role === 'VENDOR' || dto.role === 'DRIVER') && !dto.otpCode) {
            throw new common_1.BadRequestException('OTP verification required for this role');
        }
        const roleAssignment = await this.prisma.userRoleAssignment.upsert({
            where: {
                userId_role: {
                    userId,
                    role: dto.role,
                },
            },
            create: {
                userId,
                role: dto.role,
                active: true,
                metadata: dto.metadata || {},
            },
            update: {
                active: true,
                metadata: dto.metadata || {},
                updatedAt: new Date(),
            },
        });
        return {
            role: roleAssignment.role,
            active: roleAssignment.active,
        };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid current password');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        });
    }
    async uploadProfileImage(userId, imageUrl) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                profileImage: imageUrl,
                updatedAt: new Date(),
            },
        });
        return { imageUrl };
    }
    async createAddress(userId, dto) {
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false, updatedAt: new Date() },
            });
        }
        const address = await this.prisma.address.create({
            data: {
                userId,
                type: dto.type,
                label: dto.label,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                postalCode: dto.postalCode,
                latitude: dto.latitude,
                longitude: dto.longitude,
                instructions: dto.instructions,
                contactName: dto.contactName,
                contactPhone: dto.contactPhone,
                isDefault: dto.isDefault || false,
                updatedAt: new Date(),
            },
        });
        return this.mapAddressToDto(address);
    }
    async updateAddress(userId, addressId, dto) {
        const existing = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Address not found');
        }
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true, id: { not: addressId } },
                data: { isDefault: false, updatedAt: new Date() },
            });
        }
        const address = await this.prisma.address.update({
            where: { id: addressId },
            data: {
                ...dto,
                updatedAt: new Date(),
            },
        });
        return this.mapAddressToDto(address);
    }
    async deleteAddress(userId, addressId) {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        await this.prisma.address.delete({
            where: { id: addressId },
        });
    }
    async getAddresses(userId) {
        const addresses = await this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        return addresses.map((addr) => this.mapAddressToDto(addr));
    }
    async setDefaultAddress(userId, addressId) {
        const address = await this.prisma.address.findFirst({
            where: { id: addressId, userId },
        });
        if (!address) {
            throw new common_1.NotFoundException('Address not found');
        }
        await this.prisma.$transaction([
            this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false, updatedAt: new Date() },
            }),
            this.prisma.address.update({
                where: { id: addressId },
                data: { isDefault: true, updatedAt: new Date() },
            }),
        ]);
        return { defaultAddressId: addressId };
    }
    async getDefaultAddress(userId) {
        const address = await this.prisma.address.findFirst({
            where: { userId, isDefault: true },
        });
        if (!address) {
            throw new common_1.NotFoundException('No default address set', 'USERS/DEFAULT_ADDRESS_NOT_SET');
        }
        return this.mapAddressToDto(address);
    }
    async registerPushToken(userId, dto) {
        await this.prisma.pushToken.upsert({
            where: {
                userId_deviceId: {
                    userId,
                    deviceId: dto.deviceId,
                },
            },
            create: {
                userId,
                deviceId: dto.deviceId,
                platform: dto.platform,
                pushToken: dto.pushToken,
                isActive: true,
                lastSeen: new Date(),
            },
            update: {
                pushToken: dto.pushToken,
                platform: dto.platform,
                isActive: true,
                lastSeen: new Date(),
                updatedAt: new Date(),
            },
        });
        return { deviceId: dto.deviceId };
    }
    async getDevices(userId) {
        const devices = await this.prisma.pushToken.findMany({
            where: { userId, isActive: true },
            orderBy: { lastSeen: 'desc' },
        });
        return devices.map((device) => ({
            deviceId: device.deviceId,
            platform: device.platform,
            lastSeen: device.lastSeen,
        }));
    }
    async deleteDevice(userId, deviceId) {
        const device = await this.prisma.pushToken.findFirst({
            where: { userId, deviceId },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found', 'USERS/DEVICE_NOT_FOUND');
        }
        await this.prisma.pushToken.delete({
            where: {
                userId_deviceId: {
                    userId,
                    deviceId,
                },
            },
        });
    }
    async getPreferences(userId) {
        const prefs = await this.prisma.userPreference.findUnique({
            where: { userId },
        });
        return (prefs?.preferences || {
            notifications: { orderUpdates: true, promotions: false },
        });
    }
    async updatePreferences(userId, preferences) {
        const updated = await this.prisma.userPreference.upsert({
            where: { userId },
            create: {
                userId,
                preferences,
            },
            update: {
                preferences,
                updatedAt: new Date(),
            },
        });
        return updated.preferences;
    }
    mapAddressToDto(address) {
        return {
            id: address.id,
            type: address.type,
            label: address.label,
            address: address.address,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            latitude: address.latitude,
            longitude: address.longitude,
            instructions: address.instructions,
            contactName: address.contactName,
            contactPhone: address.contactPhone,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map