// fetch-single-vendor.dto.ts
import { IsNumber } from 'class-validator';

export class FetchSingleVendorDto {
  @IsNumber()
  vendor_id: number;
}
