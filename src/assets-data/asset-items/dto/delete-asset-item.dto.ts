import { IsNumber } from 'class-validator';

export class DeleteAssetItemDto {
  @IsNumber()
  asset_item_id: number;  // Role ID to be deleted
}