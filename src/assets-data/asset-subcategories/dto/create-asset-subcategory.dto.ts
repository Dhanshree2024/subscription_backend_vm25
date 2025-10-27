export class CreateAssetSubcategoryDto {
    sub_category_id: number;
    main_category_id: number;
    sub_category_name:string | null;
    sub_category_description:string | null;
    parent_organization_id: number;
    is_active: number;
    is_deleted: number;
    added_by: number;
    created_at: Date | null;
    updated_at: Date | null;

}
