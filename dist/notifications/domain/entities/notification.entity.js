"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEntity = void 0;
class NotificationEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get title() {
        return this.props.title;
    }
    get message() {
        return this.props.message;
    }
    get type() {
        return this.props.type;
    }
    get isRead() {
        return this.props.isRead;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    markAsRead() {
        if (!this.props.isRead) {
            this.props.isRead = true;
            this.props.updatedAt = new Date();
        }
    }
    toJSON() {
        return { ...this.props };
    }
}
exports.NotificationEntity = NotificationEntity;
//# sourceMappingURL=notification.entity.js.map