"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const common_1 = require("@nestjs/common");
class Email {
    value;
    constructor(email) {
        if (!this.isValid(email)) {
            throw new common_1.BadRequestException('Invalid email format');
        }
        this.value = email.toLowerCase().trim();
    }
    isValid(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    getValue() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.Email = Email;
//# sourceMappingURL=email.vo.js.map