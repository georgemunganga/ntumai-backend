import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { TaskEntity } from '../../domain/entities/task.entity';
import { Task as PrismaTask } from '@prisma/client';

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TaskEntity | null> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    return task ? this.toDomain(task) : null;
  }

  async save(task: TaskEntity): Promise<TaskEntity> {
    const saved = await this.prisma.task.upsert({
      where: { id: task.id || 'non-existent-id' },
      update: {
        status: task.status as any,
        price: task.price,
        pickupAddress: task.pickupAddress ?? {},
        dropoffAddress: task.dropoffAddress ?? {},
        details: task.details ?? {},
        description: task.description ?? null,
        paymentMethod: task.paymentMethod ?? 'CARD',
        taskerId: task.taskerId ?? null,
      },
      create: {
        id: task.id,
        customerId: task.customerId,
        taskType: task.taskType,
        status: task.status as any,
        price: task.price,
        paymentMethod: task.paymentMethod ?? 'CARD',
        pickupAddress: task.pickupAddress ?? {},
        dropoffAddress: task.dropoffAddress ?? {},
        details: task.details ?? {},
        description: task.description ?? null,
      },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaTask): TaskEntity {
    return new TaskEntity({
      ...raw,
      taskerId: raw.taskerId ?? undefined,
      description: raw.description ?? undefined,
      details: raw.details ?? undefined,
      price: raw.price.toNumber(),
    });
  }
}
