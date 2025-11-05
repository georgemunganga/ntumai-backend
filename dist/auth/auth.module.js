"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const communications_module_1 = require("../communications/communications.module");
const notifications_module_1 = require("../notifications/notifications.module");
const auth_controller_1 = require("./presentation/controllers/auth.controller");
const auth_service_1 = require("./application/services/auth.service");
const prisma_user_repository_1 = require("./infrastructure/repositories/prisma-user.repository");
const prisma_otp_challenge_repository_1 = require("./infrastructure/repositories/prisma-otp-challenge.repository");
const prisma_refresh_token_repository_1 = require("./infrastructure/repositories/prisma-refresh-token.repository");
const jwt_service_1 = require("./infrastructure/services/jwt.service");
const otp_service_1 = require("./infrastructure/services/otp.service");
const email_service_1 = require("./infrastructure/services/email.service");
const sms_service_1 = require("./infrastructure/services/sms.service");
const jwt_strategy_1 = require("./infrastructure/strategies/jwt.strategy");
const jwt_auth_guard_1 = require("./infrastructure/guards/jwt-auth.guard");
const roles_guard_1 = require("./infrastructure/guards/roles.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            communications_module_1.CommunicationsModule,
            notifications_module_1.NotificationsModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({}),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_service_1.JwtTokenService,
            otp_service_1.OtpService,
            email_service_1.EmailService,
            sms_service_1.SmsService,
            prisma_user_repository_1.PrismaUserRepository,
            prisma_otp_challenge_repository_1.PrismaOtpChallengeRepository,
            prisma_refresh_token_repository_1.PrismaRefreshTokenRepository,
            jwt_strategy_1.JwtStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
        ],
        exports: [jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map