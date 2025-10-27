import { IsNumber, IsString, IsArray, IsOptional, IsDate } from 'class-validator';
import { AssetItemsRelation } from 'src/assets-data/asset-items/entities/asset-item-relations.entity';

export class CreateAssetStockSerialsDto {
    @IsNumber()
    asset_stocks_unique_id: number;


    @IsNumber()
    asset_id: number;

    @IsNumber()
    stock_id: number;

    @IsString()
    unique_id: string;
    
    @IsArray()
    @IsOptional()
    stock_asset_relation_id?: AssetItemsRelation[];
    
    @IsOptional()
    license_detail: any[] | null;

    @IsDate()
     depreciation_start_date : Date;

     @IsDate()
     depreciation_end_date : Date;

     
    @IsNumber()
    buy_price: number;

     
    
}
