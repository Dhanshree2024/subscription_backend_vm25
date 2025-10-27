import { IsNumber } from 'class-validator';
export class DeleteVendorsDto {
  @IsNumber()
  vendor_ids: number[]; // Role ID to be deleted
}

