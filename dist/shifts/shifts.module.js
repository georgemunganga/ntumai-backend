"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsModule = void 0;
const common_1 = require("@nestjs/common");
const shift_controller_1 = require("./presentation/controllers/shift.controller");
const shift_service_1 = require("./application/services/shift.service");
const prisma_shift_repository_1 = require("./infrastructure/repositories/prisma-shift.repository");
const shifts_gateway_1 = require("./infrastructure/websocket/shifts.gateway");
const shift_repository_interface_1 = require("./domain/repositories/shift.repository.interface");
const database_module_1 = require("../shared/database/database.module");
let ShiftsModule = class ShiftsModule {
};
exports.ShiftsModule = ShiftsModule;
exports.ShiftsModule = ShiftsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [shift_controller_1.ShiftController],
        providers: [
            shift_service_1.ShiftService,
            shifts_gateway_1.ShiftsGateway,
            {
                provide: shift_repository_interface_1.SHIFT_REPOSITORY,
                useClass: prisma_shift_repository_1.PrismaShiftRepository,
            },
        ],
        exports: [shift_service_1.ShiftService, shift_repository_interface_1.SHIFT_REPOSITORY],
    })
], ShiftsModule);
//# sourceMappingURL=shifts.module.js.map