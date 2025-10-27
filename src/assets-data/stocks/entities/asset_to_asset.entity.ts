import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('asset_to_asset_mapping')
export class AssetToAssetMapping {

  @PrimaryGeneratedColumn()
  mapping_id: number;

  @Column()
  asset_id: number;

  @Column()
  asset_item_id: number;

  @Column()
  asset_stocks_unique_id: number;

  @Column()
  stock_serials: string;

}
