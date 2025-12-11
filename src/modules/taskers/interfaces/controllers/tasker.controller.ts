import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TaskerService } from '../../application/services/tasker.service';
import { CreateTaskerDto, UpdateTaskerDto } from '../dtos/tasker.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';

@Controller('api/v1/taskers')
@UseGuards(JwtAuthGuard)
export class TaskerController {
  constructor(private readonly taskerService: TaskerService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.taskerService.findById(id);
  }

  @Post()
  async create(@Body() createTaskerDto: CreateTaskerDto) {
    return this.taskerService.create(createTaskerDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskerDto: UpdateTaskerDto) {
    return this.taskerService.update(id, updateTaskerDto);
  }
}
