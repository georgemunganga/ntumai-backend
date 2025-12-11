import { Module } from '@nestjs/common';
import { TaskerController } from './interfaces/controllers/tasker.controller';
import { TaskerService } from './application/services/tasker.service';
import { TaskerRepository } from './infrastructure/repositories/tasker.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [TaskerController],
  providers: [TaskerService, TaskerRepository, PrismaService],
  exports: [TaskerService, TaskerRepository],
})
export class TaskersModule {}
