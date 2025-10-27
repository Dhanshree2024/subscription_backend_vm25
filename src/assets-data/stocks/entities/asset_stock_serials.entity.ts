
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinColumn, ManyToOne } from 'typeorm';
import { AssetItemsRelation } from 'src/assets-data/asset-items/entities/asset-item-relations.entity';
import { Stock } from './stocks.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';
import { AssetItem } from 'src/assets-data/asset-items/entities/asset-item.entity';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';

@Entity('asset_stock_serials')
export class AssetStockSerialsRepository {
   
    @PrimaryGeneratedColumn()
    asset_stocks_unique_id: number;

    @Column()
    asset_id: number;

    @Column()
    stock_id: number;


    @Column()
    asset_item_id: number;

    @Column()
    stock_serials: string;

    @Column()
    license_key: string;

    @Column()
    system_code: string;
    
    @Column({ type: 'jsonb', nullable: true })
    stock_asset_relation_id: number[]| null;

    @Column({ type: 'jsonb', nullable: true })
    license_detail: any[] | null;

    @Column()
    depreciation_start_date: Date;

    @Column()
    depreciation_end_date: Date;

    @Column()
    buy_price: number;
    
    @ManyToOne(() => Stock, (stock) => stock.stock_serials)
    @JoinColumn({ name: 'stock_id' }) 
    stock: Stock;

    @ManyToOne(() => AssetDatum) 
    @JoinColumn({ name: 'asset_id' })
    asset_data: AssetDatum;

    @ManyToOne(() => AssetItem) 
    @JoinColumn({ name: 'asset_item_id' })
    asset_item: AssetItem;

    // @ManyToOne(() => AssetMappingRepository) 
    // @JoinColumn({ name: 'system_code',referencedColumnName:'system_code' })
    // mapping_data: AssetMappingRepository;

    @ManyToOne(() => AssetMappingRepository, (mapping) => mapping.system_code)
    @JoinColumn({ name: 'system_code', referencedColumnName:"system_code"})
    mapping_data: AssetMappingRepository;

    related_stock_serials: any[];

}
