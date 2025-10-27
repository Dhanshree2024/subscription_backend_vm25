// dto/get-role.dto.ts
import { IsNumber } from 'class-validator';

export class GetRoleDto {
  @IsNumber()
  role_id: number; // Single role ID
}
