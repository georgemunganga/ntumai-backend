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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const user_entity_1 = require("../../domain/entities/user.entity");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const phone_vo_1 = require("../../domain/value-objects/phone.vo");
const password_vo_1 = require("../../domain/value-objects/password.vo");
let PrismaUserRepository = class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.toDomain(user) : null;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? this.toDomain(user) : null;
    }
    async findByPhone(phone) {
        const user = await this.prisma.user.findUnique({ where: { phone } });
        return user ? this.toDomain(user) : null;
    }
    async findByIdentifier(identifier) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { phone: identifier }],
            },
        });
        return user ? this.toDomain(user) : null;
    }
    async create(user) {
        const created = await this.prisma.user.create({
            data: {
                id: user.id,
                email: user.email?.getValue(),
                phone: user.phone?.getValue(),
                firstName: user.firstName,
                lastName: user.lastName,
                password: user.password.getValue(),
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                updatedAt: new Date(),
            },
        });
        return this.toDomain(created);
    }
    async update(user) {
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.email?.getValue(),
                phone: user.phone?.getValue(),
                firstName: user.firstName,
                lastName: user.lastName,
                password: user.password.getValue(),
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
            },
        });
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.user.delete({ where: { id } });
    }
    async exists(email, phone) {
        const conditions = [];
        if (email)
            conditions.push({ email });
        if (phone)
            conditions.push({ phone });
        if (conditions.length === 0)
            return false;
        const count = await this.prisma.user.count({
            where: {
                OR: conditions,
            },
        });
        return count > 0;
    }
    toDomain(prismaUser) {
        return new user_entity_1.UserEntity({
            id: prismaUser.id,
            email: prismaUser.email ? new email_vo_1.Email(prismaUser.email) : undefined,
            phone: prismaUser.phone ? phone_vo_1.Phone.fromE164(prismaUser.phone) : undefined,
            firstName: prismaUser.firstName,
            lastName: prismaUser.lastName,
            password: password_vo_1.Password.fromHash(prismaUser.password),
            role: prismaUser.role,
            isEmailVerified: prismaUser.isEmailVerified,
            isPhoneVerified: prismaUser.isPhoneVerified,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt,
        });
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map