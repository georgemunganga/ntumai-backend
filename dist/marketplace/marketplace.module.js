"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceModule = void 0;
const common_1 = require("@nestjs/common");
const marketplace_controller_1 = require("./marketplace.controller");
const catalog_service_1 = require("./catalog/application/services/catalog.service");
const cart_service_1 = require("./cart/application/services/cart.service");
const order_service_1 = require("./orders/application/services/order.service");
const vendor_service_1 = require("./vendor/application/services/vendor.service");
const promotion_service_1 = require("./promotions/application/services/promotion.service");
const review_service_1 = require("./reviews/application/services/review.service");
const database_module_1 = require("../shared/database/database.module");
const auth_module_1 = require("../auth/auth.module");
let MarketplaceModule = class MarketplaceModule {
};
exports.MarketplaceModule = MarketplaceModule;
exports.MarketplaceModule = MarketplaceModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, auth_module_1.AuthModule],
        controllers: [marketplace_controller_1.MarketplaceController],
        providers: [
            catalog_service_1.CatalogService,
            cart_service_1.CartService,
            order_service_1.OrderService,
            vendor_service_1.VendorService,
            promotion_service_1.PromotionService,
            review_service_1.ReviewService,
        ],
        exports: [
            catalog_service_1.CatalogService,
            cart_service_1.CartService,
            order_service_1.OrderService,
            vendor_service_1.VendorService,
            promotion_service_1.PromotionService,
            review_service_1.ReviewService,
        ],
    })
], MarketplaceModule);
//# sourceMappingURL=marketplace.module.js.map