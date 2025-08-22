export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}