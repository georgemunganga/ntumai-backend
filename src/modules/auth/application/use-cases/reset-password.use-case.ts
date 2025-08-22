export interface ResetPasswordCommand {
  phoneNumber?: string;
  email?: string;
  countryCode?: string;
  otp: string;
  newPassword: string;
  requestId: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export abstract class ResetPasswordUseCase {
  abstract execute(command: ResetPasswordCommand): Promise<ResetPasswordResult>;
}