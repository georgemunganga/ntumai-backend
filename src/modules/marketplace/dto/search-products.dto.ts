import { IsNotEmpty, IsString } from 'class-validator';
import { ProductQueryDto } from './product-query.dto';

export class SearchProductsDto extends ProductQueryDto {
  @IsString()
  @IsNotEmpty()
  query!: string;
}
