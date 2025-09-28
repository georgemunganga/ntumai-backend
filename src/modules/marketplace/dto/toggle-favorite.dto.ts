import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleFavoriteDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;
}
