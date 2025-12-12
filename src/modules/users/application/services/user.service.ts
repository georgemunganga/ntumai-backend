import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    return this.userRepository.findByPhoneNumber(phoneNumber);
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async createOrUpdateUser(
    phoneNumber?: string,
    email?: string,
  ): Promise<UserEntity> {
    let user: UserEntity | null = null;

    if (phoneNumber) {
      user = await this.userRepository.findByPhoneNumber(phoneNumber);
    } else if (email) {
      user = await this.userRepository.findByEmail(email);
    }

    if (!user) {
      user = new UserEntity({
        phoneNumber,
        email,
        status: 'PENDING_VERIFICATION',
      });
    }

    return this.userRepository.save(user);
  }

  async activateUser(user: UserEntity): Promise<UserEntity> {
    user.activate();
    return this.userRepository.save(user);
  }

  async updateUser(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, data);
    return this.userRepository.save(user);
  }
}
