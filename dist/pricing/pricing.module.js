"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pricing_controller_1 = require("./presentation/controllers/pricing.controller");
const pricing_calculator_service_1 = require("./application/services/pricing-calculator.service");
const signature_service_1 = require("./infrastructure/crypto/signature.service");
const in_memory_rate_table_repository_1 = require("./infrastructure/repositories/in-memory-rate-table.repository");
const rate_table_repository_interface_1 = require("./domain/repositories/rate-table.repository.interface");
let PricingModule = class PricingModule {
};
exports.PricingModule = PricingModule;
exports.PricingModule = PricingModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [pricing_controller_1.PricingController],
        providers: [
            pricing_calculator_service_1.PricingCalculatorService,
            signature_service_1.SignatureService,
            {
                provide: rate_table_repository_interface_1.RATE_TABLE_REPOSITORY,
                useClass: in_memory_rate_table_repository_1.InMemoryRateTableRepository,
            },
        ],
        exports: [pricing_calculator_service_1.PricingCalculatorService, signature_service_1.SignatureService],
    })
], PricingModule);
//# sourceMappingURL=pricing.module.js.map