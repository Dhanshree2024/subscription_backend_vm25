import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  request_id: number; // ID of the billing record to update

  @IsNotEmpty()
  @IsString()
  status: string; // New status value, e.g., 'pending', 'approved', 'rejected'
}
