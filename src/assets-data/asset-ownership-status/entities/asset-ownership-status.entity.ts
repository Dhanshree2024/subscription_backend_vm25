import { Stock } from "src/assets-data/stocks/entities/stocks.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';


export enum OwnershipType {
  CAPEX = 'capex',
  OPEX = 'opex',
}  


@Entity('asset_ownership_status_types')
export class AssetOwnershipStatus {
  @PrimaryGeneratedColumn()
  ownership_status_type_id: number;

  @Column()
  ownership_status_type_name: string;

  @Column()
  asset_ownership_status_color: string;

 @Column()
  ownership_status_description:string;

  @Column()
  is_active: number;

  @Column()
  is_deleted: number;

@Column({
    type: 'enum',
    enum: OwnershipType,
    enumName: 'ownership_type_enum', // name of enum type created in DB
  })
  ownership_status_type: OwnershipType;


   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}

