import { IsNumber } from 'class-validator';

export class GetAssetItemWithRelationsDto {
  @IsNumber()
  asset_item_id: number;
}