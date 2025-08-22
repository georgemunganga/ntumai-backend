export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
}

export abstract class ChangePasswordUseCase {
  abstract execute(command: ChangePasswordCommand): Promise<ChangePasswordResult>;
}