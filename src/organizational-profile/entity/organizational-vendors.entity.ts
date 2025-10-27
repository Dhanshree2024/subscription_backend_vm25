// user.entity.ts
import { Stock } from 'src/assets-data/stocks/entities/stocks.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from './organizational-user.entity';
@Entity('vendors')
export class OrganizationVendors {

  @PrimaryGeneratedColumn()
  vendor_id: number;

  @Column()
  vendor_name: string;

  @Column()
  vendor_gst_no: string;

  @Column()
  vendor_street: string;

  @Column()
  vendor_landmark: string;

  @Column()
  vendor_city: string;

  @Column()
  vendor_state: string; // Corresponds to tenant_org_id in organizational_profile

  @Column()
  vendor_country: string;

  @Column()
  vendor_pincode: string;

  @Column()
  vendor_contact_number: string;

  @Column()
  vendor_email: string;

  @Column()
  vendor_primary_contact: String;

  @Column()
  vendor_alternative_contact_number: string;
  

  @Column()
  is_active: number;

  @Column()
  is_deleted: number;


  @Column()
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  added_by_user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Stock, (stock) => stock.vendor_info)
  stocks: Stock[]; // No need for @JoinColumn in OneToMany

  // @OneToMany(() => Stock)
  // @JoinColumn({ name: 'vendor_id' })
  // stocks: Stock[];

  @Column()
  vendor_first_name: string;

  @Column()
  vendor_middle_name: string;

  @Column()
  vendor_last_name: string

  @Column()
  vendor_degination: string

  @Column()
  vendor_department: string


  @Column()
  vendor_gst_status: string

  @Column()
  vendor_display_name: string

}