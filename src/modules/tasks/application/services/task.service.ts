import { Injectable, Inject } from '@nestjs/common';
import { TaskRepository } from '../../infrastructure/repositories/task.repository';
import { TaskEntity } from '../../domain/entities/task.entity';
import { KafkaProducerService } from '../../../kafka/kafka.producer.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async findById(id: string): Promise<TaskEntity | null> {
    return this.taskRepository.findById(id);
  }

  async create(data: Partial<TaskEntity>): Promise<TaskEntity> {
    const task = new TaskEntity(data);
    const createdTask = await this.taskRepository.save(task);
    await this.kafkaProducer.sendMessage('task.created', createdTask);
    return createdTask;
  }

  async update(id: string, data: Partial<TaskEntity>): Promise<TaskEntity> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }
    Object.assign(task, data);
    return this.taskRepository.save(task);
  }
}
