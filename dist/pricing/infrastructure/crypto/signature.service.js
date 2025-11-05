"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
let SignatureService = class SignatureService {
    configService;
    secret;
    keyId;
    constructor(configService) {
        this.configService = configService;
        this.secret =
            this.configService.get('PRICING_HMAC_SECRET') ||
                'pricing-calculator-secret-2025-change-in-production';
        this.keyId =
            this.configService.get('PRICING_KEY_ID') || 'calc_key_2025_10';
    }
    sign(canonicalPayload, ttlSeconds) {
        const issued_at = new Date().toISOString();
        const canon_hash = this.hashCanonical(canonicalPayload);
        const signatureData = JSON.stringify({
            key_id: this.keyId,
            issued_at,
            ttl_seconds: ttlSeconds,
            canon_hash,
        });
        const hmac = (0, crypto_1.createHmac)('sha256', this.secret);
        hmac.update(signatureData);
        const sig = `pc.sig.v1.${hmac.digest('base64')}`;
        return {
            sig,
            sig_fields: {
                alg: 'HMAC-SHA256',
                key_id: this.keyId,
                issued_at,
                ttl_seconds: ttlSeconds,
                canon_hash,
            },
        };
    }
    verify(canonicalPayload, sig, sig_fields) {
        try {
            if (!sig.startsWith('pc.sig.v1.')) {
                return false;
            }
            if (sig_fields.key_id !== this.keyId) {
                return false;
            }
            const expectedHash = this.hashCanonical(canonicalPayload);
            if (sig_fields.canon_hash !== expectedHash) {
                return false;
            }
            const signatureData = JSON.stringify({
                key_id: sig_fields.key_id,
                issued_at: sig_fields.issued_at,
                ttl_seconds: sig_fields.ttl_seconds,
                canon_hash: sig_fields.canon_hash,
            });
            const hmac = (0, crypto_1.createHmac)('sha256', this.secret);
            hmac.update(signatureData);
            const expectedSig = `pc.sig.v1.${hmac.digest('base64')}`;
            return sig === expectedSig;
        }
        catch (error) {
            return false;
        }
    }
    isExpired(issued_at, ttl_seconds) {
        const issuedTime = new Date(issued_at).getTime();
        const expiryTime = issuedTime + ttl_seconds * 1000;
        return Date.now() > expiryTime;
    }
    hashCanonical(payload) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(payload);
        return `sha256:${hash.digest('hex').substring(0, 16)}`;
    }
};
exports.SignatureService = SignatureService;
exports.SignatureService = SignatureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SignatureService);
//# sourceMappingURL=signature.service.js.map