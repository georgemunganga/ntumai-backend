import { Injectable } from '@nestjs/common';
import { TaskerRepository } from '../../infrastructure/repositories/tasker.repository';
import { TaskerEntity } from '../../domain/entities/tasker.entity';

@Injectable()
export class TaskerService {
  constructor(private readonly taskerRepository: TaskerRepository) {}

  async findById(id: string): Promise<TaskerEntity | null> {
    return this.taskerRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<TaskerEntity | null> {
    return this.taskerRepository.findByUserId(userId);
  }

  async create(data: Partial<TaskerEntity>): Promise<TaskerEntity> {
    const tasker = new TaskerEntity(data);
    return this.taskerRepository.save(tasker);
  }

  async update(id: string, data: Partial<TaskerEntity>): Promise<TaskerEntity> {
    const tasker = await this.taskerRepository.findById(id);
    if (!tasker) {
      throw new Error('Tasker not found');
    }
    Object.assign(tasker, data);
    return this.taskerRepository.save(tasker);
  }
}
