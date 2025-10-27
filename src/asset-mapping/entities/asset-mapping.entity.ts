import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { Branch } from 'src/organizational-profile/entity/branches.entity';
import { Department } from 'src/organizational-profile/entity/department.entity';
import { AssetStatusTypes } from 'src/assets-data/asset-fields/entities/asset-status-types.entity';
import { AssetDatum } from 'src/assets-data/asset-data/entities/asset-datum.entity';
import { Stock } from 'src/assets-data/stocks/entities/stocks.entity';
import { AssetDetailArray } from 'src/assets-data/stocks/entities/stocks.entity';
import { AssetStockSerialsRepository } from 'src/assets-data/stocks/entities/asset_stock_serials.entity';

@Entity('asset_mapping')
export class AssetMappingRepository {
  @PrimaryGeneratedColumn()
  mapping_id: number;

  @Column()
  asset_id: number;

  @ManyToOne(() => AssetStockSerialsRepository)
  @JoinColumn({ name:'system_code', referencedColumnName: 'system_code' })
  unique_mapping: AssetStockSerialsRepository;

  @ManyToOne(() => AssetDatum)
  @JoinColumn({ name: 'asset_id' })
  asset: AssetDatum;

  @Column()
  asset_managed_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asset_managed_by' })
  managed_user: User;

  @Column()
  asset_used_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asset_used_by' })
  user: User;

  @Column()
  branch_id: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  map_branch: Branch;

  @Column()
  status_type_id: number;

  @ManyToOne(() => AssetStatusTypes)
  @JoinColumn({ name: 'status_type_id' })
  status: AssetStatusTypes;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  department_id: number;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column()
  reallocation_mapping_id: number;

  @Column()
  quantity: number;

  @Column({ type: 'integer' })
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  added_by_user: User;

  @Column({ type: 'integer' })
  updated_by: number;

  @CreateDateColumn({ type: 'date' })
  created_at: Date;

  @UpdateDateColumn({ type: 'date' })
  updated_at: Date;

  @Column({ type: 'smallint', default: 1 })
  is_active: number;

  @Column({ type: 'smallint', default: 0 })
  is_deleted: number;

  @Column({ default: 0 })
  mapping_type: number;

  @Column()
  stock_id: number;

  @Column()
  system_code: string;

  // @Column('jsonb', { nullable: true,name:"unique_id"}) // Store assetDetails as JSONB
  // unique_id: AssetDetailArray[];

  @Column({ type: 'varchar', name: 'unique_id' })
  unique_id: string;
}
