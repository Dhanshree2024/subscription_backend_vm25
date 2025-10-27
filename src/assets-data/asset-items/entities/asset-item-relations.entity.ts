import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne } from "typeorm";
import { AssetRelationDto } from "../dto/create-asset-item.dto";
import { AssetItem } from "./asset-item.entity";


export enum RelationType {
    Other = 'Other',
    Accessory = 'Accessory',
    Contract = 'Contract',
    Application = 'Application',
  }

@Entity({ name: 'asset_items_relations'})
export class AssetItemsRelation {
    
    @PrimaryGeneratedColumn()
    relation_id: number;

    @Column()
    parent_asset_item_id: number;

    @Column()
    child_asset_item_id: number;

    
    @Column() // Ensure boolean type
    is_active: number;

    @Column() // Ensure boolean type
    is_deleted: number;

    @Column() 
    created_at: Date;

    @Column() 
    updated_at: Date;

    @Column()
    created_by: number;

    @Column()
    updated_by: number;

    @Column({
        type: 'enum',
        enum: RelationType,
        // default: RelationType.PARENT, // Optional: Set default value
      })
    relation_type: RelationType;

    @ManyToOne(() => AssetItem, (assetItem) => assetItem.related_items) // FIXED: Added relation here
    @JoinColumn({ name: 'parent_asset_item_id' })
    parent_item: AssetItem;

    @ManyToOne(() => AssetItem, (assetItem) => assetItem.asset_item_id)
    @JoinColumn({ name: 'child_asset_item_id', referencedColumnName:"asset_item_id"})
    child_item: AssetItem;
}


