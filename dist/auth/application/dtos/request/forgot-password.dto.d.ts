export declare class ForgotPasswordDto {
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
}
export declare class ResetPasswordDto {
    otp: string;
    requestId: string;
    newPassword: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
}
