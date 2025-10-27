import { IsNumber } from 'class-validator';

export class DeleteRoleDto {
  @IsNumber()
  role_id: number;  // Role ID to be deleted
}