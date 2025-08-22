import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AuthPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
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