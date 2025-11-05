"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const communications_service_1 = require("./application/services/communications.service");
const email_provider_1 = require("./infrastructure/providers/email.provider");
const sms_provider_1 = require("./infrastructure/providers/sms.provider");
let CommunicationsModule = class CommunicationsModule {
};
exports.CommunicationsModule = CommunicationsModule;
exports.CommunicationsModule = CommunicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [communications_service_1.CommunicationsService, email_provider_1.EmailProvider, sms_provider_1.SmsProvider],
        exports: [communications_service_1.CommunicationsService, email_provider_1.EmailProvider, sms_provider_1.SmsProvider],
    })
], CommunicationsModule);
//# sourceMappingURL=communications.module.js.map