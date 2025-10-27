import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne, OneToMany } from "typeorm";
import { User } from "src/organizational-profile/entity/organizational-user.entity";
import { AssetCategory } from "src/assets-data/asset-categories/entities/asset-category.entity";
import { AssetSubcategory } from "src/assets-data/asset-subcategories/entities/asset-subcategory.entity";
import { AssetItem } from "src/assets-data/asset-items/entities/asset-item.entity";
import { Stock } from "src/assets-data/stocks/entities/stocks.entity";
import { AssetMappingRepository } from "src/asset-mapping/entities/asset-mapping.entity";
import { AssetItemsRelation } from "src/assets-data/asset-items/entities/asset-item-relations.entity";
import { AssetStockSerialsRepository } from "src/assets-data/stocks/entities/asset_stock_serials.entity";

@Entity('assets')
export class AssetDatum {
  @PrimaryGeneratedColumn()
  asset_id: number;

  @Column()
  asset_main_category_id: number;

  @Column()
  asset_sub_category_id: number;

  @Column()
  asset_item_id: number;

  @Column()
  asset_information_fields: string;

  @Column()
  asset_title: string;

  @Column()
  asset_description: string;

  @Column()
  asset_added_by: number;

  
  @OneToOne(() => User)
  @JoinColumn({ name: 'asset_added_by' })
  added_by_user: User;

  @Column()
  asset_is_active: number;

  @Column()
  asset_is_deleted: number;

  @Column()
  asset_created_at: Date;

  @Column()
  asset_updated_at: Date;

  @Column()
  manufacturer: string;

  @OneToOne(() => AssetCategory)
  @JoinColumn({ name: 'asset_main_category_id' })
  main_category: AssetCategory;

  @OneToOne(() => AssetSubcategory)
  @JoinColumn({ name: 'asset_sub_category_id' })
  sub_category: AssetSubcategory;

  @OneToOne(() => AssetItem)
  @JoinColumn({ name: 'asset_item_id' })
  asset_item: AssetItem;

  @OneToMany(() => AssetItemsRelation, (relation) => relation.parent_item)
  @JoinColumn({ name: 'asset_item_id' })
  related_items: AssetItemsRelation[];

  @OneToOne(() => Stock, (stock) => stock.asset_info) // Changed from 'asset' to 'asset_info'
  stock: Stock;

  @OneToMany(() => AssetMappingRepository, (mapping) => mapping.asset)
  assigned_quantity: AssetMappingRepository[];

  @OneToOne(() => AssetStockSerialsRepository)
  @JoinColumn({ name: 'asset_id' })
  uniques: AssetStockSerialsRepository;

  @OneToOne(() => User)
  @JoinColumn({ name: 'asset_added_by' }) // this column exists in AssetDatum table
  fetchCount: User;
}
