import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../modules/common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthPrismaService extends PrismaService {
  constructor(configService: ConfigService) {
    super(configService);
  }

  // Auth-specific database operations can be added here
  async findUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string) {
    return this.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: any) {
    return this.user.create({
      data,
    });
  }

  async updateUser(id: string, data: any) {
    return this.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return this.user.delete({
      where: { id },
    });
  }
}