"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenEntity = void 0;
class RefreshTokenEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get tokenHash() {
        return this.props.tokenHash;
    }
    get userId() {
        return this.props.userId;
    }
    get deviceId() {
        return this.props.deviceId;
    }
    get ipAddress() {
        return this.props.ipAddress;
    }
    get userAgent() {
        return this.props.userAgent;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get isRevoked() {
        return this.props.isRevoked;
    }
    get revokedAt() {
        return this.props.revokedAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    isExpired() {
        return new Date() > this.props.expiresAt;
    }
    isValid() {
        return !this.isRevoked && !this.isExpired();
    }
    revoke() {
        this.props.isRevoked = true;
        this.props.revokedAt = new Date();
    }
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            deviceId: this.deviceId,
            ipAddress: this.ipAddress,
            userAgent: this.userAgent,
            expiresAt: this.expiresAt,
            isRevoked: this.isRevoked,
            revokedAt: this.revokedAt,
            createdAt: this.createdAt,
        };
    }
}
exports.RefreshTokenEntity = RefreshTokenEntity;
//# sourceMappingURL=refresh-token.entity.js.map