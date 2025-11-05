import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { IndustryTypes } from 'src/organizational-profile/public_schema_entity/industry-types.entity';

@Entity({ name: 'resellers', schema: 'pricing' })
export class Reseller {
  @PrimaryGeneratedColumn()
  reseller_id: number;

  // 🏢 Reseller name (company or individual)
  @Column({ type: 'varchar', length: 150 })
  reseller_name: string;

  // 👤 Contact person details
  @Column({ type: 'varchar', length: 100 })
  contact_first_name: string;

  @Column({ type: 'varchar', length: 100 })
  contact_last_name: string;

  // 📧 Primary contact info
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string;

  @Column({ type: 'int', nullable: true })
  industry_id: number | null;

  // 💳 Payment Term
  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_term: string | null;

  // 🧾 GST Info
  @Column({ type: 'boolean', default: false })
  gst_registered: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gst_number: string | null;

  // 🏠 Address info
  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line2: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postal_code: string;

  // ⚙️ Status & metadata
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => IndustryTypes, { eager: false })
  @JoinColumn({ name: 'industry_id', referencedColumnName: 'industryId' })
  industry: IndustryTypes;

}
