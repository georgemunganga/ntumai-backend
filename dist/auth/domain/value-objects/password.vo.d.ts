export declare class Password {
    private readonly hashedValue;
    private constructor();
    static create(plainPassword: string): Promise<Password>;
    static fromHash(hashedPassword: string): Password;
    private static validate;
    compare(plainPassword: string): Promise<boolean>;
    getValue(): string;
}
