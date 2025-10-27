import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { AssetCategory } from "../../asset-categories/entities/asset-category.entity";
import { AssetSubcategory } from "src/assets-data/asset-subcategories/entities/asset-subcategory.entity";
import { AssetItemsRelation } from "./asset-item-relations.entity";
import { AssetItemsFieldsMapping } from "src/assets-data/asset-items-fields-mapping/entities/asset-items-fields-mapping.entity";
import { AssetStockSerialsRepository } from "src/assets-data/stocks/entities/asset_stock_serials.entity";

export enum ItemType {
  PHYSICAL = 'Physical',
  VIRTUAL = 'Virtual',
}

@Entity("asset_items")
export class AssetItem {

    @PrimaryGeneratedColumn()
    asset_item_id:number

    @Column()
    main_category_id:number

    @Column()
    sub_category_id:number

    @Column()
    asset_item_name:string

    @Column()
    asset_item_description:string

    @Column()
    parent_organization_id:number

    @Column()
    added_by:number

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

    @Column()
    created_at:Date

    @Column()
    updated_at:Date

    @Column()
    is_licensable:Boolean

    @Column({
	  type: 'enum',
	  enum: ItemType,
	  enumName: 'item_type_enum', // name of enum type created in DB
	})
	item_type: ItemType;

  @Column()
    has_depreciation:Boolean

    @Column()
    company_act_asset_life:number
    @Column()
    it_act_asset_life:number
    @Column()
    company_depreciation_rate:number
    @Column()
    it_act_depreciation_rate:number
    @Column()
    company_act_residual_value:number
    @Column()
    it_act_residual_value:number

    @Column()
    preffered_method: number

    @OneToOne(() => AssetCategory)
    @JoinColumn({ name: 'main_category_id' })
    main_category: AssetCategory;

    @OneToOne(() => AssetSubcategory)
    @JoinColumn({ name: 'sub_category_id' })
    sub_category: AssetSubcategory;

    @OneToMany(() => AssetItemsRelation, (relation) => relation.parent_item)
    related_items: AssetItemsRelation[];


    @OneToMany(() => AssetStockSerialsRepository, (serial) => serial.asset_item)
serials: AssetStockSerialsRepository[];

    
}
