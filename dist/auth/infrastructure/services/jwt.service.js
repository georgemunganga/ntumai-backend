"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
let JwtTokenService = class JwtTokenService {
    jwtService;
    configService;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async generateAccessToken(payload) {
        return this.jwtService.signAsync({ ...payload, type: 'access' }, {
            secret: this.configService.get('jwt.access.secret'),
            expiresIn: this.configService.get('jwt.access.ttl'),
        });
    }
    async generateRefreshToken(payload) {
        return this.jwtService.signAsync({ ...payload, type: 'refresh' }, {
            secret: this.configService.get('jwt.refresh.secret'),
            expiresIn: this.configService.get('jwt.refresh.ttl'),
        });
    }
    async generateRegistrationToken(payload) {
        return this.jwtService.signAsync({ ...payload, type: 'registration' }, {
            secret: this.configService.get('jwt.registration.secret'),
            expiresIn: this.configService.get('jwt.registration.ttl'),
        });
    }
    async verifyAccessToken(token) {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get('jwt.access.secret'),
        });
    }
    async verifyRefreshToken(token) {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get('jwt.refresh.secret'),
        });
    }
    async verifyRegistrationToken(token) {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get('jwt.registration.secret'),
        });
    }
    async hashToken(token) {
        return bcrypt.hash(token, 10);
    }
    async compareToken(token, hash) {
        return bcrypt.compare(token, hash);
    }
    getAccessTokenTtl() {
        return this.configService.get('jwt.access.ttl') || 3600;
    }
    getRefreshTokenTtl() {
        return this.configService.get('jwt.refresh.ttl') || 604800;
    }
    getRegistrationTokenTtl() {
        return this.configService.get('jwt.registration.ttl') || 600;
    }
};
exports.JwtTokenService = JwtTokenService;
exports.JwtTokenService = JwtTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtTokenService);
//# sourceMappingURL=jwt.service.js.map