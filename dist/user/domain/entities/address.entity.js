"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressEntity = void 0;
class AddressEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new AddressEntity({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new AddressEntity(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get type() {
        return this.props.type;
    }
    get label() {
        return this.props.label;
    }
    get address() {
        return this.props.address;
    }
    get city() {
        return this.props.city;
    }
    get state() {
        return this.props.state;
    }
    get country() {
        return this.props.country;
    }
    get postalCode() {
        return this.props.postalCode;
    }
    get latitude() {
        return this.props.latitude;
    }
    get longitude() {
        return this.props.longitude;
    }
    get instructions() {
        return this.props.instructions;
    }
    get contactName() {
        return this.props.contactName;
    }
    get contactPhone() {
        return this.props.contactPhone;
    }
    get isDefault() {
        return this.props.isDefault;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    setAsDefault() {
        this.props.isDefault = true;
        this.props.updatedAt = new Date();
    }
    unsetDefault() {
        this.props.isDefault = false;
        this.props.updatedAt = new Date();
    }
    update(updates) {
        Object.assign(this.props, updates, { updatedAt: new Date() });
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.AddressEntity = AddressEntity;
//# sourceMappingURL=address.entity.js.map