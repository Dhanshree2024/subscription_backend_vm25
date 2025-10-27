import { CreateAssetMappingDto } from "./create-asset-mapping.dto";
import { CreateAssetStockSerialsDto } from '../../assets-data/stocks/dto/create-assetstock-serial.dto'
import { AssetItemsRelation } from "../../assets-data/asset-items/entities/asset-item-relations.entity";
import { AssetRelationDto } from "../../assets-data/asset-items/dto/create-asset-item.dto";
import { CreateStockDto } from "../../assets-data/stocks/dto/create-stock.dto";


export class GetAllUniqueMappedAssetsDto {
    // 🔹 Asset Mapping Information
    mapping_type: number;
    asset_id: number;
    asset_used_by: string;
    asset_managed_by: string;
    branch_id: number;
    status_type_id: number;
    description: string;
    department_id: number;
    reallocation_mapping_id: number | null;
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
    is_deleted: boolean;
    quantity: number;
  
    // 🔹 Asset Details
    asset_item_name: string;
    asset_item_description: string;
    sub_category_id: number;
    main_category_id: number;
    parent_organization_id: number;
    added_by: string;
  
    // 🔹 Stock Information
    previous_available_quantity: number;
    total_available_quantity: number;
    vendor_id: number;
    stock_status: string;
    warranty_start: Date;
    warranty_end: Date;
  
    // 🔹 Ownership Information
    asset_ownership_status: string;
  
    // 🔹 Asset Stock Serials Information
    asset_stock_serials_id: number;
    asset_stock_serials: string;
    asset_stock_serials_status: string;
    stock_id: number;
  }
  
