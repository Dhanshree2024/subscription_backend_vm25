import { IsArray, IsString } from "class-validator";

export class CreateAssetMappingDto {
    mapping_id: number;
    asset_id: number;
    stock_id: number; 
    asset_used_by: number | null;
    asset_managed_by: number | null;
    branch_id: number | null;
    status_type_id: number | null;
    description: string | null;
    department_id: number | null;
    reallocation_mapping_id: number | null;
    created_by: number | null;
    updated_by: number | null;
    created_at: Date | null;
    updated_at: Date | null;
    is_active: number ;
    is_deleted: number;
    quantity: number | null;
    mapping_type:number|null;
    system_code: string | null;
    @IsString()
    unique_id: string;
  }