import { User } from '../../domain/entities/user.entity';

export interface LoginUserCommand {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginUserResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export abstract class LoginUserUseCase {
  abstract execute(command: LoginUserCommand): Promise<LoginUserResult>;
}