import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

// ==================== OTP Start Flow ====================

export class StartOtpDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class StartOtpResponseDto {
  success: boolean;
  data: {
    sessionId: string;
    expiresIn: number;
    flowType: 'login' | 'signup';
    channelsSent: string[];
  };
}

// ==================== OTP Verification ====================

export class VerifyOtpDto {
  @IsString()
  sessionId: string;

  @IsString()
  otp: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class VerifyOtpResponseDto {
  success: boolean;
  data: {
    flowType: 'login' | 'signup';
    requiresRoleSelection: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    onboardingToken?: string;
    user: {
      id: string;
      email?: string;
      phone?: string;
      role?: string;
    };
  };
}

// ==================== Role Selection ====================

export class SelectRoleDto {
  @IsString()
  onboardingToken: string;

  @IsString()
  role: 'customer' | 'tasker' | 'vendor';
}

export class SelectRoleResponseDto {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email?: string;
      phone?: string;
      role: string;
    };
  };
}

// ==================== Get Current User ====================

export class CurrentUserResponseDto {
  success: boolean;
  data: {
    user: {
      id: string;
      email?: string;
      phone?: string;
      role?: string;
      status: string;
    };
  };
}

// ==================== Error Response ====================

export class ErrorResponseDto {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
