import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects';

export interface RegisterUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  countryCode?: string;
  role?: string;
}

export interface RegisterUserResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export abstract class RegisterUserUseCase {
  abstract execute(command: RegisterUserCommand): Promise<RegisterUserResult>;
}