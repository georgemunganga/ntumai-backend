import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RatingService } from '../../application/services/rating.service';
import { CreateRatingDto } from '../dtos/rating.dto';

@Controller('api/v1/ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ratingService.findById(id);
  }

  @Post()
  async create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingService.create(createRatingDto);
  }
}
