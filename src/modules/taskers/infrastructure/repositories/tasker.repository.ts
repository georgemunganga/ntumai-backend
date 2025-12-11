import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { TaskerEntity } from '../../domain/entities/tasker.entity';
import { Tasker as PrismaTasker } from '@prisma/client';

@Injectable()
export class TaskerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TaskerEntity | null> {
    const tasker = await this.prisma.tasker.findUnique({ where: { id } });
    return tasker ? this.toDomain(tasker) : null;
  }

  async findByUserId(userId: string): Promise<TaskerEntity | null> {
    const tasker = await this.prisma.tasker.findUnique({ where: { userId } });
    return tasker ? this.toDomain(tasker) : null;
  }

  async save(tasker: TaskerEntity): Promise<TaskerEntity> {
    const saved = await this.prisma.tasker.upsert({
      where: { id: tasker.id || 'non-existent-id' },
      update: { status: tasker.status, availability: tasker.availability, vehicleType: tasker.vehicleType as any, rating: tasker.rating },
      create: { id: tasker.id, userId: tasker.userId, status: tasker.status, availability: tasker.availability, vehicleType: tasker.vehicleType as any, rating: tasker.rating },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaTasker): TaskerEntity {
    return new TaskerEntity(raw);
  }
}
