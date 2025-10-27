import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('item_licence_type')
export class ItemLicenceType {
  @PrimaryColumn()
  licence_id: number;

  @Column({  default: 1 })
  is_active: number;

  @Column({  default: 0 })
  is_delete: number;

  @Column({ type: 'boolean', default: true })
  licence_key_type: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licence_type: string;

  @Column({ type: 'boolean', default: true })
  needs_license_key: boolean;

  @Column({ type: 'boolean', default: false })
  bulk_license: boolean;

  @Column({ type: 'boolean', default: false })
  needs_start_date: boolean;

  @Column({ type: 'boolean', default: false })
  needs_end_date: boolean;

  @Column({ type: 'boolean', default: false })
  is_renewable: boolean;

  @Column({ type: 'boolean', default: false })
  has_expiry: boolean;

  @Column({ type: 'boolean', default: true })
  show_in_stock_form: boolean;

  @Column({ type: 'boolean', default: false })
  have_plan_type: boolean;

}
