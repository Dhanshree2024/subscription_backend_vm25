import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ItemType } from '../entities/asset-item.entity';
export class UpdateAssetItemDto {
      asset_item_id: number;
      asset_item_name: string;
      asset_item_description?: string;
      main_category_id: number;
      sub_category_id: number;

     @IsEnum(ItemType)
      item_type: ItemType;     
      
      is_licensable:Boolean;
      added_by: number;

      
        has_depreciation:Boolean;
        company_act_asset_life: number;
        it_act_asset_life: number;
          company_depreciation_rate: number;
         it_act_depreciation_rate: number;
          company_act_residual_value: number;
        it_act_residual_value: number;
        preffered_method :number;
      asset_relation?: { asset_item_id_2: number; relation_type: string }[]; // Add this field 
}

export class AssetRelationDto {
  asset_item_id_2: number;
  relation_type: string;
}
