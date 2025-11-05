"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingModule = void 0;
const common_1 = require("@nestjs/common");
const matching_controller_1 = require("./presentation/controllers/matching.controller");
const matching_service_1 = require("./application/services/matching.service");
const prisma_booking_repository_1 = require("./infrastructure/repositories/prisma-booking.repository");
const mock_matching_engine_adapter_1 = require("./infrastructure/adapters/mock-matching-engine.adapter");
const matching_gateway_1 = require("./infrastructure/websocket/matching.gateway");
const booking_repository_interface_1 = require("./domain/repositories/booking.repository.interface");
const database_module_1 = require("../shared/database/database.module");
let MatchingModule = class MatchingModule {
};
exports.MatchingModule = MatchingModule;
exports.MatchingModule = MatchingModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [matching_controller_1.MatchingController],
        providers: [
            matching_service_1.MatchingService,
            matching_gateway_1.MatchingGateway,
            {
                provide: booking_repository_interface_1.BOOKING_REPOSITORY,
                useClass: prisma_booking_repository_1.PrismaBookingRepository,
            },
            {
                provide: 'MATCHING_ENGINE',
                useClass: mock_matching_engine_adapter_1.MockMatchingEngineAdapter,
            },
        ],
        exports: [matching_service_1.MatchingService, booking_repository_interface_1.BOOKING_REPOSITORY],
    })
], MatchingModule);
//# sourceMappingURL=matching.module.js.map