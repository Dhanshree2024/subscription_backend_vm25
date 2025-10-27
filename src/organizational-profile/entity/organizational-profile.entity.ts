// organizational-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from './organizational-user.entity'; // Assuming User entity is defined in the same folder
import { Department } from './department.entity';
import { Branch } from './branches.entity';
import { IndustryTypes } from '../public_schema_entity/industry-types.entity';

@Entity('organizational_profile')
export class OrganizationalProfile {
  @PrimaryGeneratedColumn()
  organization_profile_id: number;

  @Column()
  org_name: string;

  @Column()
  industry_type_id: number;


  @OneToOne(() => IndustryTypes)
  @JoinColumn({ name: 'industry_type_id' })
  industry_type: IndustryTypes;

  @Column()
  organization_location_name: string;

  @Column()
  organization_address: string;

  @Column()
  email: string;

  @Column()
  city: string;

  @Column()
  pincode: number;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  mobile_number: string;

  @Column()
  org_alt_contact_number: string;


  @Column()
  base_currency: string;

  @Column()
  financial_year: string;

  @Column()
  dateformat: string;

  @Column()
  time_zone: string;

  @Column()
  website_url: string;

  @Column()
  street: string;

  @Column()
  landmark: string;

  @Column()
  gst_no: string;

  @Column()
  esi_number: string;

  @Column()
  lin_number: string;

  @Column()
  pan_number: string;

  @Column()
  tan_number: string;

  @Column()
  pf_number: string;

  @Column()
  report_basis: string;

  @Column({ type: 'date' })
  established_date: Date;

  @Column()
  tenant_org_id: number;

  @OneToMany(() => User, (user) => user.organization) // One-to-many relationship with users
  users: User[];

  @Column()
  org_profile_image_address: string;

  @Column()
  billingContactName: string

  @Column()
  billingContactEmail: string

  @Column()
  billingContactPhone: number

  @Column()
  themeMode: string

  @Column()
  customThemeColor: string

  @Column()
  logo: string

  // @OneToMany(() => Department, (department) => department.organizationProfile)
  // departments: Department[]; // Add this property for the one-to-many relationship
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}