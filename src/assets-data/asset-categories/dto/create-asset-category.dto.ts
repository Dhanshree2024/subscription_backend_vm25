export class CreateAssetCategoryDto {

    main_category_id: number;
    main_category_name:string | null;
    main_category_description:string | null;
    parent_organization_id: number;
    is_active: number;
    is_deleted: number;
    added_by: number;
    created_at: Date | null;
    updated_at: Date | null;
}
