import { Module } from '@nestjs/common';
import { TaskController } from './interfaces/controllers/task.controller';
import { TaskService } from './application/services/task.service';
import { TaskRepository } from './infrastructure/repositories/task.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  controllers: [TaskController],
  imports: [KafkaModule],
  providers: [TaskService, TaskRepository, PrismaService],
  exports: [TaskService, TaskRepository],
})
export class TasksModule {}
