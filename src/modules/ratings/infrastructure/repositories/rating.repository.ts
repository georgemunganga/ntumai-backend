import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { RatingEntity } from '../../domain/entities/rating.entity';
import { Rating as PrismaRating } from '@prisma/client';

@Injectable()
export class RatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RatingEntity | null> {
    const rating = await this.prisma.rating.findUnique({ where: { id } });
    return rating ? this.toDomain(rating) : null;
  }

  async save(rating: RatingEntity): Promise<RatingEntity> {
    const saved = await this.prisma.rating.upsert({
      where: { id: rating.id || 'non-existent-id' },
      update: { ...rating },
      create: { ...rating },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaRating): RatingEntity {
    return new RatingEntity({
      ...raw,
      taskerId: raw.taskerId ?? undefined,
      vendorId: raw.vendorId ?? undefined,
      comment: raw.comment ?? undefined,
    });
  }
}
