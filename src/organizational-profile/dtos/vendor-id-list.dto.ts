import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class VendorIdListDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    vendor_ids: number[];
}