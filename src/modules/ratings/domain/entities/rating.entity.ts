import { Rating as PrismaRating } from '@prisma/client';

export class RatingEntity {
  id: string;
  customerId: string;
  taskerId?: string;
  vendorId?: string;
  rating: number;
  comment?: string;

  constructor(data: Partial<RatingEntity>) {
    Object.assign(this, data);
  }
}
