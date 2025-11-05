export declare class Email {
    private readonly value;
    constructor(email: string);
    private isValid;
    getValue(): string;
    equals(other: Email): boolean;
    toString(): string;
}
