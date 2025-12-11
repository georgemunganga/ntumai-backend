import { Injectable } from '@nestjs/common';
import { RatingRepository } from '../../infrastructure/repositories/rating.repository';
import { RatingEntity } from '../../domain/entities/rating.entity';

@Injectable()
export class RatingService {
  constructor(private readonly ratingRepository: RatingRepository) {}

  async findById(id: string): Promise<RatingEntity | null> {
    return this.ratingRepository.findById(id);
  }

  async create(data: Partial<RatingEntity>): Promise<RatingEntity> {
    const rating = new RatingEntity(data);
    return this.ratingRepository.save(rating);
  }
}
