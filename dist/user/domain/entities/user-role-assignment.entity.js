"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoleAssignmentEntity = void 0;
class UserRoleAssignmentEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(userId, role, metadata) {
        return new UserRoleAssignmentEntity({
            id: crypto.randomUUID(),
            userId,
            role,
            active: true,
            metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new UserRoleAssignmentEntity(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get role() {
        return this.props.role;
    }
    get active() {
        return this.props.active;
    }
    get metadata() {
        return this.props.metadata;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    activate() {
        this.props.active = true;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.active = false;
        this.props.updatedAt = new Date();
    }
    updateMetadata(metadata) {
        this.props.metadata = metadata;
        this.props.updatedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.UserRoleAssignmentEntity = UserRoleAssignmentEntity;
//# sourceMappingURL=user-role-assignment.entity.js.map