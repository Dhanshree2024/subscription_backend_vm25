import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { AssetStockSerialsRepository } from '../../assets-data/stocks/entities/asset_stock_serials.entity'; 
  
  @Entity('asset_to_asset_mapping')
  export class AssetToAssetMapping {
    @PrimaryGeneratedColumn({ name: 'mapping_id', type: 'int' })
    mapping_id: number;
  
    @Column({ name: 'asset_id', type: 'int', nullable: true })
    asset_id: number;
  
    @Column({ name: 'stock_serials', type: 'text', nullable: true })
    stock_serials: string;
  
    @ManyToOne(() => AssetStockSerialsRepository, { nullable: true })
    @JoinColumn({ name: 'asset_stocks_unique_id' })
    asset_stock: AssetStockSerialsRepository;
  }
  