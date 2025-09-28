export interface ForgotPasswordCommand {
  phone?: string;
  email?: string;
  countryCode?: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  resetToken?: string; // Only for testing/development
}

export abstract class ForgotPasswordUseCase {
  abstract execute(command: ForgotPasswordCommand): Promise<ForgotPasswordResult>;
}