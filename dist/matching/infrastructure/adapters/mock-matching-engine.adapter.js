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
exports.MockMatchingEngineAdapter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
let MockMatchingEngineAdapter = class MockMatchingEngineAdapter {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findCandidates(criteria) {
        const riders = await this.prisma.user.findMany({
            where: {
                role: 'DRIVER',
            },
            take: 10,
        });
        if (riders.length === 0) {
            return this.getMockRiders(criteria);
        }
        const candidates = riders.map((rider) => {
            const mockDistance = Math.random() * (criteria.radius_km || 10);
            const eta_min = Math.ceil(mockDistance * 3);
            return {
                user_id: rider.id,
                name: `${rider.firstName} ${rider.lastName}`,
                vehicle: criteria.vehicle_type,
                phone: rider.phone || '+260972000000',
                rating: 4.5 + Math.random() * 0.5,
                eta_min,
            };
        });
        return candidates
            .sort((a, b) => (a.eta_min || 0) - (b.eta_min || 0))
            .slice(0, 3);
    }
    getMockRiders(criteria) {
        const mockRiders = [
            {
                user_id: 'usr_r_101',
                name: 'John Mwamba',
                vehicle: criteria.vehicle_type,
                phone: '+260972111111',
                rating: 4.8,
                eta_min: 5,
            },
            {
                user_id: 'usr_r_102',
                name: 'Jane Phiri',
                vehicle: criteria.vehicle_type,
                phone: '+260972222222',
                rating: 4.9,
                eta_min: 7,
            },
            {
                user_id: 'usr_r_103',
                name: 'Peter Banda',
                vehicle: criteria.vehicle_type,
                phone: '+260972333333',
                rating: 4.7,
                eta_min: 10,
            },
        ];
        const count = Math.floor(Math.random() * 3) + 1;
        return mockRiders.slice(0, count);
    }
};
exports.MockMatchingEngineAdapter = MockMatchingEngineAdapter;
exports.MockMatchingEngineAdapter = MockMatchingEngineAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MockMatchingEngineAdapter);
//# sourceMappingURL=mock-matching-engine.adapter.js.map