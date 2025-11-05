import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
export interface JwtPayload {
    sub: string;
    email?: string;
    phone?: string;
    role: string;
    type: 'access' | 'refresh' | 'registration';
}
export interface RegistrationTokenPayload {
    identifier: string;
    identifierType: 'email' | 'phone';
}
export declare class JwtTokenService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: NestJwtService, configService: ConfigService);
    generateAccessToken(payload: Omit<JwtPayload, 'type'>): Promise<string>;
    generateRefreshToken(payload: Omit<JwtPayload, 'type'>): Promise<string>;
    generateRegistrationToken(payload: RegistrationTokenPayload): Promise<string>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    verifyRefreshToken(token: string): Promise<JwtPayload>;
    verifyRegistrationToken(token: string): Promise<RegistrationTokenPayload>;
    hashToken(token: string): Promise<string>;
    compareToken(token: string, hash: string): Promise<boolean>;
    getAccessTokenTtl(): number;
    getRefreshTokenTtl(): number;
    getRegistrationTokenTtl(): number;
}
