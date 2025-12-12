import { Module } from '@nestjs/common';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserService } from './application/services/user.service';

@Module({
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UsersModule {}
