import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

export interface GetUserProfileCommand {
  userId: string;
}

export interface GetUserProfileResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  error?: string;
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: GetUserProfileCommand): Promise<GetUserProfileResult> {
    try {
      const user = await this.userRepository.findById(command.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email.value,
          name: user.fullName,
          role: user.getRole().value,
          phone: user.phone?.value,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }
  }
}