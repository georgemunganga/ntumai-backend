export declare enum OtpPurposeDto {
    LOGIN = "login",
    REGISTER = "register",
    PASSWORD_RESET = "password_reset"
}
export declare class OtpRequestDto {
    purpose: OtpPurposeDto;
    email?: string;
    phone?: string;
    countryCode?: string;
}
