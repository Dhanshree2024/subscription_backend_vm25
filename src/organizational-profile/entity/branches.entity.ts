import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { User } from './organizational-user.entity';
import { Locations } from './locations.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn({ name: 'branch_id' })
  branch_id: number;

  @Column({ name: 'branch_name' })
  branch_name: string;

  @Column({ name: 'gst_no' })
  gstNo: string;

  @Column({ name: 'city_id' })
  city_id: number;

  @Column({ name: 'country_id' })
  country_id: number;

  @Column({ name: 'location_id' })
  location_id: number;

  @Column({ name: 'branch_street' })
  branch_street: string;

  @Column({ name: 'branch_landmark' })
  branch_landmark: string;

  @Column({ name: 'city' })
  city: string;

  @Column({ name: 'state' })
  state: string;

  @Column({ name: 'country' })
  country: string;

  @Column({ name: 'pincode' })
  pincode: number;

  @Column()
  established_date: Date;

  @Column({ name: 'contact_number' })
  contact_number: string;

  @Column({ name: 'branch_email' })
  branch_email: string;

  @Column({ name: 'alternative_contact_number' })
  alternative_contact_number: string;

  @Column({ name: 'primary_user_id' })
  primary_user_id: number;

  @OneToOne(() => User, (user) => user.branchAsPrimary)
  @JoinColumn({ name: 'primary_user_id' })
  primaryUser: User;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column()
  is_active: boolean;

  @Column()
  is_deleted: boolean;

  @Column({ name: 'created_by' })
  created_by: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_user: User; // User who created the department
  
  @OneToMany(() => Locations, (location) => location.branch)
  locations: Locations[];
}
