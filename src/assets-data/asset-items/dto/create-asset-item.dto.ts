import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsNumber, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { AssetCategory } from 'src/assets-data/asset-categories/entities/asset-category.entity';
import { AssetSubcategory } from 'src/assets-data/asset-subcategories/entities/asset-subcategory.entity';
import { JoinColumn, ManyToOne } from 'typeorm';
import { ItemType } from '../entities/asset-item.entity';
export class CreateAssetItemNewDto {
  
  @IsString()
  asset_item_name: string;

  @IsOptional()
  @IsString()
  asset_item_description: string;

  @IsNumber()
  sub_category_id: number;

  @IsNumber()
  main_category_id: number;

  @IsEnum(ItemType)
item_type: ItemType;

  @IsBoolean()
  is_licensable:Boolean;

   @IsBoolean()
  has_depreciation:Boolean;

  @IsNumber()
  company_act_asset_life: number;
   @IsNumber()
  it_act_asset_life: number;
   @IsNumber()
  company_depreciation_rate: number;
   @IsNumber()
  it_act_depreciation_rate: number;
   @IsNumber()
  company_act_residual_value: number;
  
   @IsNumber()
  it_act_residual_value: number;
  @IsNumber()
  preffered_method :number;

  @IsOptional()
  @IsString()
  parent_organization_id: string;
  
  @IsNumber()
  added_by: number;

  @IsArray()
  asset_relation:AssetRelationDto[]

  @ManyToOne(() => AssetCategory, category => category.main_category_id)
  @JoinColumn({ name: 'category_id' })
  category: AssetCategory;

  @ManyToOne(() => AssetSubcategory, subCategory => subCategory.sub_category_id)
  @JoinColumn({ name: 'sub_category_id' })
  subCategory: AssetSubcategory;
  
}
export class AssetRelationDto {
  asset_item_id_2: number;
  relation_type: string;
}