// src/stock/entities/stock.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { AssetDatum } from "src/assets-data/asset-data/entities/asset-datum.entity"
import { AssetOwnershipStatus } from "src/assets-data/asset-ownership-status/entities/asset-ownership-status.entity";
import { OrganizationVendors } from "src/organizational-profile/entity/organizational-vendors.entity"
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { AssetStockSerialsRepository } from './asset_stock_serials.entity';

import { AssetItemsRelation } from 'src/assets-data/asset-items/entities/asset-item-relations.entity';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';
import { Branch } from 'src/organizational-profile/entity/branches.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  stock_id: number;

  @Column()
  asset_id: number;

  @Column()
  previous_available_quantity: number;

  @Column()
  total_available_quantity: number;

  @Column()
  quantity: number;

  @Column()
  description: string;

  @Column()
  vendor_id: number;

  @Column()
  branch_id: number;

  @ManyToOne(() => OrganizationVendors, (vendor) => vendor.stocks)
  @JoinColumn({ name: 'vendor_id' })
  vendor_info: OrganizationVendors;

  @Column()
  created_by: number;

  @Column({ nullable: true })
  updated_by: number;

  @Column({ default: 1 })
  is_active: number;

  @Column({ default: 0 })
  is_deleted: number;

  @Column()
  created_at: Date;

  @Column()
  asset_ownership_status: number;

  @OneToOne(() => AssetOwnershipStatus)
  @JoinColumn({ name: 'asset_ownership_status' })
  ownership_information: AssetOwnershipStatus;

  @OneToOne(() => AssetDatum, (asset) => asset.stock)
  @JoinColumn({ name: 'asset_id' })
  asset_info: AssetDatum;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_user: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_user: User;

  @Column('jsonb', { nullable: true, name: 'unique_description' }) // Store assetDetails as JSONB
  assetDetails: AssetDetailArray[];

  @Column({ type: 'date', nullable: true })
  warranty_start?: Date;

  @Column({ type: 'date', nullable: true })
  warranty_end?: Date;

  @Column({ type: 'decimal', nullable: true })
  buy_price?: number;

  @Column({ type: 'date', nullable: true })
  purchase_date?: Date;

  @Column({ type: 'varchar', nullable: true })
  invoice_no?: string;

  @Column({ type: 'jsonb', nullable: true })
  license_details: any[];

  @OneToMany(
    () => AssetStockSerialsRepository,
    (stock_serials) => stock_serials.stock,
  )
  stock_serials: AssetStockSerialsRepository[];

  assetMappings: any;

  @OneToOne(() => AssetStockSerialsRepository)
  @JoinColumn({ name: 'stock_id' })
  serials: AssetStockSerialsRepository;

  @ManyToOne(() => AssetOwnershipStatus)
  @JoinColumn({ name: 'asset_ownership_status' }) // FK column in stock
  ownershipStatus: AssetOwnershipStatus;
}

export interface AssetDetailArray {
    serial_number: string | null,
    license_details?: string | null;
    department_id: number | null, 
    asset_item_id: number | null,
    asset_used_by: number | null,
    asset_managed_by: number | null,
    status_type_id: number | null
    // New fields
    system_code?: string | null,          // Optional system-generated code
    generated_serial_number?: string | null, // Optional generated serial
    license_key?: string | null,          // Optional license key
    warranty_start?: string | null,       // Optional warranty dates
    warranty_end?: string | null
    
}