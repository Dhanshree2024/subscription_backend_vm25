import { IsNumber } from 'class-validator';

export class FetchSingleUserDto {
  @IsNumber()
  user_id: number;
}
