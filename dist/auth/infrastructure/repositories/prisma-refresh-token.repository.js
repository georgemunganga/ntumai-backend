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
exports.PrismaRefreshTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
let PrismaRefreshTokenRepository = class PrismaRefreshTokenRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByTokenHash(tokenHash) {
        const token = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        return token ? this.toDomain(token) : null;
    }
    async findByUserId(userId) {
        const tokens = await this.prisma.refreshToken.findMany({
            where: { userId },
        });
        return tokens.map((token) => this.toDomain(token));
    }
    async findByUserIdAndDeviceId(userId, deviceId) {
        const token = await this.prisma.refreshToken.findFirst({
            where: { userId, deviceId },
        });
        return token ? this.toDomain(token) : null;
    }
    async create(token) {
        const created = await this.prisma.refreshToken.create({
            data: {
                id: token.id,
                tokenHash: token.tokenHash,
                userId: token.userId,
                deviceId: token.deviceId,
                ipAddress: token.ipAddress,
                userAgent: token.userAgent,
                expiresAt: token.expiresAt,
                isRevoked: token.isRevoked,
                revokedAt: token.revokedAt,
            },
        });
        return this.toDomain(created);
    }
    async update(token) {
        const updated = await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: {
                isRevoked: token.isRevoked,
                revokedAt: token.revokedAt,
            },
        });
        return this.toDomain(updated);
    }
    async revokeByTokenHash(tokenHash) {
        await this.prisma.refreshToken.update({
            where: { tokenHash },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
    }
    async revokeAllByUserId(userId) {
        const result = await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        return result.count;
    }
    async revokeByUserIdAndDeviceId(userId, deviceId) {
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                deviceId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
    }
    async deleteExpired() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }
    toDomain(prismaToken) {
        return new refresh_token_entity_1.RefreshTokenEntity({
            id: prismaToken.id,
            tokenHash: prismaToken.tokenHash,
            userId: prismaToken.userId,
            deviceId: prismaToken.deviceId,
            ipAddress: prismaToken.ipAddress,
            userAgent: prismaToken.userAgent,
            expiresAt: prismaToken.expiresAt,
            isRevoked: prismaToken.isRevoked,
            revokedAt: prismaToken.revokedAt,
            createdAt: prismaToken.createdAt,
        });
    }
};
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository;
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRefreshTokenRepository);
//# sourceMappingURL=prisma-refresh-token.repository.js.map