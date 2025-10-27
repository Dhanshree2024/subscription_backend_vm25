export class CreateAssetsStatusDto {

    status_type_id: number;
    status_type_name:string | null;
    status_color_code:string| null;
    is_active: number;
    is_deleted: number;
    asset_status_description : string | null;
    created_at: Date | null;

}
