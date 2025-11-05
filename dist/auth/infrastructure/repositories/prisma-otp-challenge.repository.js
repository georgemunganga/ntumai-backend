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
exports.PrismaOtpChallengeRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const otp_challenge_entity_1 = require("../../domain/entities/otp-challenge.entity");
let PrismaOtpChallengeRepository = class PrismaOtpChallengeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByChallengeId(challengeId) {
        const challenge = await this.prisma.otpChallenge.findUnique({
            where: { challengeId },
        });
        return challenge ? this.toDomain(challenge) : null;
    }
    async findActiveByIdentifier(identifier) {
        const challenge = await this.prisma.otpChallenge.findFirst({
            where: {
                identifier,
                isVerified: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return challenge ? this.toDomain(challenge) : null;
    }
    async create(challenge) {
        const created = await this.prisma.otpChallenge.create({
            data: {
                id: challenge.id,
                challengeId: challenge.challengeId,
                identifier: challenge.identifier,
                identifierType: challenge.identifierType,
                otpCodeHash: challenge.otpCodeHash,
                purpose: challenge.purpose,
                attempts: challenge.attempts,
                maxAttempts: challenge.maxAttempts,
                expiresAt: challenge.expiresAt,
                resendAvailableAt: challenge.resendAvailableAt,
                isVerified: challenge.isVerified,
                verifiedAt: challenge.verifiedAt,
                ipAddress: challenge.ipAddress,
                userAgent: challenge.userAgent,
            },
        });
        return this.toDomain(created);
    }
    async update(challenge) {
        const updated = await this.prisma.otpChallenge.update({
            where: { id: challenge.id },
            data: {
                attempts: challenge.attempts,
                isVerified: challenge.isVerified,
                verifiedAt: challenge.verifiedAt,
            },
        });
        return this.toDomain(updated);
    }
    async invalidateByIdentifier(identifier) {
        await this.prisma.otpChallenge.updateMany({
            where: {
                identifier,
                isVerified: false,
            },
            data: {
                isVerified: true,
                verifiedAt: new Date(),
            },
        });
    }
    async deleteExpired() {
        const result = await this.prisma.otpChallenge.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }
    toDomain(prismaChallenge) {
        return new otp_challenge_entity_1.OtpChallengeEntity({
            id: prismaChallenge.id,
            challengeId: prismaChallenge.challengeId,
            identifier: prismaChallenge.identifier,
            identifierType: prismaChallenge.identifierType,
            otpCodeHash: prismaChallenge.otpCodeHash,
            purpose: prismaChallenge.purpose,
            attempts: prismaChallenge.attempts,
            maxAttempts: prismaChallenge.maxAttempts,
            expiresAt: prismaChallenge.expiresAt,
            resendAvailableAt: prismaChallenge.resendAvailableAt,
            isVerified: prismaChallenge.isVerified,
            verifiedAt: prismaChallenge.verifiedAt,
            ipAddress: prismaChallenge.ipAddress,
            userAgent: prismaChallenge.userAgent,
            createdAt: prismaChallenge.createdAt,
        });
    }
};
exports.PrismaOtpChallengeRepository = PrismaOtpChallengeRepository;
exports.PrismaOtpChallengeRepository = PrismaOtpChallengeRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOtpChallengeRepository);
//# sourceMappingURL=prisma-otp-challenge.repository.js.map