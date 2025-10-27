export class CreateAssetWorkingStatusDto {

    working_status_type_id: number;
    working_status_type_name:string | null;
    working_status_color:string | null;
    is_active: number;
    is_deleted: number;
    working_status_description:string;
    created_at: Date | null;

}
