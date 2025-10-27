import { IsNumber, IsArray } from 'class-validator';

export class DeleteRoleDto {
  @IsArray()
  @IsNumber({}, { each: true })
  role_id: number[];
}
