export class CreateAssetDatumDto {

    asset_id: number;
    asset_main_category_id: number;
    asset_sub_category_id: number;
    asset_item_id: number;
    asset_information_fields:string | null;
    asset_description: string | null;
    asset_title: string | null;
   
    asset_added_by: number;
    asset_is_active: number;
    asset_is_deleted: number;
    asset_created_at: Date | null;
    asset_updated_at: Date | null;
    manufacturer: string|null;
   
}


