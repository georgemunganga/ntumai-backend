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
exports.OtpCode = void 0;
const bcrypt = __importStar(require("bcrypt"));
class OtpCode {
    code;
    constructor(code) {
        this.code = code;
    }
    static generate() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        return new OtpCode(code);
    }
    static fromPlain(code) {
        return new OtpCode(code);
    }
    async hash() {
        return bcrypt.hash(this.code, 10);
    }
    async verify(hashedCode) {
        return bcrypt.compare(this.code, hashedCode);
    }
    getValue() {
        return this.code;
    }
    toString() {
        return this.code;
    }
}
exports.OtpCode = OtpCode;
//# sourceMappingURL=otp-code.vo.js.map