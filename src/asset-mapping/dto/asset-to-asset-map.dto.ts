import  {AssetStockSerialsRepository} from '../../assets-data/stocks/entities/asset_stock_serials.entity';

import { IsNumber, IsArray } from 'class-validator';

export class AssetToAssetMapDto {
  @IsNumber()
  asset_id: number; // Main asset ID

  @IsArray()
  @IsNumber({}, { each: true }) // Ensures each is a number
  mapped_asset_ids: number[]; // List of mapped assets
  
}
