import { AssetField } from "src/assets-data/asset-fields/entities/asset-field.entity";
import { AssetFieldCategory } from "src/assets-data/asset-fields/entities/asset-field-category.entity";
import { Entity,PrimaryGeneratedColumn,Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { AssetItem } from "src/assets-data/asset-items/entities/asset-item.entity";

@Entity('asset_items_fields_mapping')
export class AssetItemsFieldsMapping {
  @PrimaryGeneratedColumn()
  aif_mapping_id: number;

  @ManyToOne(() => AssetField, (assetFields) => assetFields.asset_field_id)
  @JoinColumn({ name: 'asset_field_id' })
  assetFields: AssetField;

  @OneToOne(
    () => AssetFieldCategory,
    (assetFieldCategory) => assetFieldCategory.asset_field_category_id,
  )
  @JoinColumn({ name: 'asset_field_category_id' })
  assetFieldCategory: AssetFieldCategory;

  @Column()
  asset_item_id: number;

  @Column()
  asset_field_id: number;

  @Column()
  aif_parent_organization_id: number;

  @Column()
  aif_is_enabled: number;

  @Column()
  aif_is_mandatory: number;

  @Column()
  aif_is_active: number;

  @Column()
  aif_is_deleted: number;

  @Column()
  aif_added_by: number;

  @Column()
  aif_created_at: Date;

  @Column()
  aif_updated_at: Date;

  @Column()
  aif_description: string;

  @Column()
  asset_field_category_id: number;

  @ManyToOne(() => AssetItem, (assetFields) => assetFields.asset_item_id)
  @JoinColumn({ name: 'asset_item_id' })
  assetItems: AssetItem;

  
}
