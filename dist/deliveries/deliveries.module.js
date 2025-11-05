"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveriesModule = void 0;
const common_1 = require("@nestjs/common");
const delivery_controller_1 = require("./presentation/controllers/delivery.controller");
const delivery_service_1 = require("./application/services/delivery.service");
const in_memory_delivery_repository_1 = require("./infrastructure/repositories/in-memory-delivery.repository");
const deliveries_gateway_1 = require("./infrastructure/websocket/deliveries.gateway");
const delivery_repository_interface_1 = require("./domain/repositories/delivery.repository.interface");
const pricing_module_1 = require("../pricing/pricing.module");
let DeliveriesModule = class DeliveriesModule {
};
exports.DeliveriesModule = DeliveriesModule;
exports.DeliveriesModule = DeliveriesModule = __decorate([
    (0, common_1.Module)({
        imports: [pricing_module_1.PricingModule],
        controllers: [delivery_controller_1.DeliveryController, delivery_controller_1.RiderDeliveryController],
        providers: [
            delivery_service_1.DeliveryService,
            deliveries_gateway_1.DeliveriesGateway,
            {
                provide: delivery_repository_interface_1.DELIVERY_REPOSITORY,
                useClass: in_memory_delivery_repository_1.InMemoryDeliveryRepository,
            },
        ],
        exports: [delivery_service_1.DeliveryService],
    })
], DeliveriesModule);
//# sourceMappingURL=deliveries.module.js.map