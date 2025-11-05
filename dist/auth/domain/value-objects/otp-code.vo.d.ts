export declare class OtpCode {
    private readonly code;
    private constructor();
    static generate(): OtpCode;
    static fromPlain(code: string): OtpCode;
    hash(): Promise<string>;
    verify(hashedCode: string): Promise<boolean>;
    getValue(): string;
    toString(): string;
}
