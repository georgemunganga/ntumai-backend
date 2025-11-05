import { OtpRequestDto } from '../../application/dtos/request/otp-request.dto';
import { OtpVerifyDto } from '../../application/dtos/request/otp-verify.dto';
import { RegisterDto } from '../../application/dtos/request/register.dto';
import { RefreshTokenDto } from '../../application/dtos/request/refresh-token.dto';
import { LogoutDto } from '../../application/dtos/request/logout.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../../application/dtos/request/forgot-password.dto';
import { OtpRequestResponseDto, UserResponseDto, TokensResponseDto, RegisterResponseDto } from '../../application/dtos/response/user-response.dto';
import { AuthService } from '../../application/services/auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestOtp(dto: OtpRequestDto, req: any): Promise<OtpRequestResponseDto>;
    verifyOtp(dto: OtpVerifyDto): Promise<any>;
    register(dto: RegisterDto): Promise<RegisterResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<TokensResponseDto>;
    logout(dto: LogoutDto): Promise<{
        message: string;
    }>;
    logoutAll(req: any): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<UserResponseDto>;
    forgotPassword(dto: ForgotPasswordDto, req: any): Promise<any>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
