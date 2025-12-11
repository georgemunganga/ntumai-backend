import { Task as PrismaTask, TaskStatus } from '@prisma/client';

export class TaskEntity {
  id: string;
  customerId: string;
  taskerId?: string;
  taskType: string;
  status: TaskStatus;
  pickupAddress: any;
  dropoffAddress: any;
  description?: string;
  details?: any;
  price: number;
  paymentMethod?: string;

  constructor(data: Partial<TaskEntity>) {
    Object.assign(this, data);
  }
}
