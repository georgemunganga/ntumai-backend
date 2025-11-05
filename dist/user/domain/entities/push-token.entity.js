"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushTokenEntity = void 0;
class PushTokenEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(userId, deviceId, platform, pushToken) {
        return new PushTokenEntity({
            id: crypto.randomUUID(),
            userId,
            deviceId,
            platform,
            pushToken,
            isActive: true,
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new PushTokenEntity(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get deviceId() {
        return this.props.deviceId;
    }
    get platform() {
        return this.props.platform;
    }
    get pushToken() {
        return this.props.pushToken;
    }
    get isActive() {
        return this.props.isActive;
    }
    get lastSeen() {
        return this.props.lastSeen;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateLastSeen() {
        this.props.lastSeen = new Date();
        this.props.updatedAt = new Date();
    }
    updateToken(pushToken) {
        this.props.pushToken = pushToken;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.PushTokenEntity = PushTokenEntity;
//# sourceMappingURL=push-token.entity.js.map