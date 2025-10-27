import { IsArray, IsNumber } from 'class-validator';

export class DeleteUsersDto {
  @IsArray()
  @IsNumber({}, { each: true })
  user_ids: number[];
}