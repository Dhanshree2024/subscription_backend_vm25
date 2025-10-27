import { IsNumber } from 'class-validator';

export class DeleteAssetFieldDto {
  @IsNumber()
  asset_field_id: number;  // Role ID to be deleted
}