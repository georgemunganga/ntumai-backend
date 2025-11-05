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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Password = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
class Password {
    hashedValue;
    constructor(hashedValue) {
        this.hashedValue = hashedValue;
    }
    static async create(plainPassword) {
        this.validate(plainPassword);
        const hashed = await bcrypt.hash(plainPassword, 10);
        return new Password(hashed);
    }
    static fromHash(hashedPassword) {
        return new Password(hashedPassword);
    }
    static validate(password) {
        if (!password || password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new common_1.BadRequestException('Password must contain at least one special character');
        }
    }
    async compare(plainPassword) {
        return bcrypt.compare(plainPassword, this.hashedValue);
    }
    getValue() {
        return this.hashedValue;
    }
}
exports.Password = Password;
//# sourceMappingURL=password.vo.js.map