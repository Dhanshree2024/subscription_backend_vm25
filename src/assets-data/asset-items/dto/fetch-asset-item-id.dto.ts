import { IsInt, IsNotEmpty } from 'class-validator';

export class FetchAssetItemByIdDto {
  @IsInt()
  @IsNotEmpty()
  asset_item_id: number;
}