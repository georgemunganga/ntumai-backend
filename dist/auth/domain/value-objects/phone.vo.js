"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phone = void 0;
const common_1 = require("@nestjs/common");
const libphonenumber_js_1 = require("libphonenumber-js");
class Phone {
    value;
    constructor(phone, countryCode) {
        try {
            if (phone.startsWith('+')) {
                if (!(0, libphonenumber_js_1.isValidPhoneNumber)(phone)) {
                    throw new common_1.BadRequestException('Invalid phone number');
                }
                const parsed = (0, libphonenumber_js_1.parsePhoneNumber)(phone);
                this.value = parsed.number;
            }
            else {
                if (!countryCode) {
                    throw new common_1.BadRequestException('Country code required for phone number');
                }
                const fullNumber = `${countryCode}${phone}`;
                if (!(0, libphonenumber_js_1.isValidPhoneNumber)(fullNumber)) {
                    throw new common_1.BadRequestException('Invalid phone number');
                }
                const parsed = (0, libphonenumber_js_1.parsePhoneNumber)(fullNumber);
                this.value = parsed.number;
            }
        }
        catch (error) {
            throw new common_1.BadRequestException(`Invalid phone number: ${error.message}`);
        }
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
    static fromE164(e164) {
        return new Phone(e164);
    }
}
exports.Phone = Phone;
//# sourceMappingURL=phone.vo.js.map