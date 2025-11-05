export declare class Phone {
    private readonly value;
    constructor(phone: string, countryCode?: string);
    getValue(): string;
    equals(other: Phone): boolean;
    toString(): string;
    static fromE164(e164: string): Phone;
}
