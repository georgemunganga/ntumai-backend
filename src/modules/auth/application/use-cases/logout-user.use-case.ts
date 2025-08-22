export interface LogoutUserCommand {
  userId: string;
  refreshToken?: string;
  logoutFromAllDevices?: boolean;
}

export interface LogoutUserResult {
  success: boolean;
  message: string;
}

export abstract class LogoutUserUseCase {
  abstract execute(command: LogoutUserCommand): Promise<LogoutUserResult>;
}