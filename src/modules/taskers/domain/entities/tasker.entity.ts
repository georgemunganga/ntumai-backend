import { Tasker as PrismaTasker } from '@prisma/client';

export class TaskerEntity {
  id: string;
  userId: string;
  vehicleType: string;
  isOnline: boolean;
  rating: number;
  completedTasks: number;
  cancellationRate: number;
  kycStatus: string;
  lastLocationLat?: number;
  lastLocationLng?: number;
  status?: string;
  availability?: string;

  constructor(data: Partial<TaskerEntity>) {
    Object.assign(this, data);
  }
}
