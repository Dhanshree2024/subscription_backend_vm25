export class CreateAssetFieldDto {
     
    asset_field_id:number;
    asset_field_name:string | null;
    asset_field_description:string | null;
    asset_field_label_name:string | null;
    asset_field_type_details:string | null;
    asset_field_type:string | null;
    is_active: number;
    is_deleted: number;
    added_by: number;
    created_at: Date | null;
    updated_at: Date | null;
    is_custom_field:boolean;
}
