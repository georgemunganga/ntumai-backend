"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
class UserEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get email() {
        return this.props.email;
    }
    get phone() {
        return this.props.phone;
    }
    get firstName() {
        return this.props.firstName;
    }
    get lastName() {
        return this.props.lastName;
    }
    get fullName() {
        return `${this.props.firstName} ${this.props.lastName}`;
    }
    get password() {
        return this.props.password;
    }
    get role() {
        return this.props.role;
    }
    get isEmailVerified() {
        return this.props.isEmailVerified;
    }
    get isPhoneVerified() {
        return this.props.isPhoneVerified;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    verifyEmail() {
        this.props.isEmailVerified = true;
        this.props.updatedAt = new Date();
    }
    verifyPhone() {
        this.props.isPhoneVerified = true;
        this.props.updatedAt = new Date();
    }
    updatePassword(newPassword) {
        this.props.password = newPassword;
        this.props.updatedAt = new Date();
    }
    updateProfile(firstName, lastName) {
        this.props.firstName = firstName;
        this.props.lastName = lastName;
        this.props.updatedAt = new Date();
    }
    async verifyPassword(plainPassword) {
        return this.props.password.compare(plainPassword);
    }
    toJSON() {
        return {
            id: this.id,
            email: this.email?.getValue(),
            phone: this.phone?.getValue(),
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            isEmailVerified: this.isEmailVerified,
            isPhoneVerified: this.isPhoneVerified,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map