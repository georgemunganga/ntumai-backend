import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['price_asc', 'price_desc', 'rating', 'newest'])
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';

  @IsOptional()
  @IsString()
  filter?: string;
}
