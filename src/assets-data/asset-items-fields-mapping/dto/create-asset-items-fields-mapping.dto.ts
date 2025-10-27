export class CreateAssetItemsFieldsMappingDto {
    aif_mapping_id: number;
    asset_item_id: number;
    aif_is_enabled: number;
    aif_is_mandatory: number;
    aif_is_active: number;
    aif_is_deleted: number;
    aif_added_by: number;
    aif_created_at: Date | null;
    aif_updated_at: Date | null;
    aif_description: string | null;
    asset_field_category_id: number;
    aif_parent_organization_id: number;
    asset_field_id: number;
    assetFields: {
        asset_field_id: number;
        asset_field_name: string;
        asset_field_description: string | null;
        asset_field_label_name: string;
        asset_field_type_details: string | null;
        asset_field_category_id: number;
        parent_organization_id: number;
        added_by: number;
        is_active: number;
        is_deleted: number;
        created_at: Date | null;
        updated_at: Date | null;
        asset_field_type: string;
    };
}
