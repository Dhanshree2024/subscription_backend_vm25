import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegisterOrganization } from './register-organization.entity';

@Entity('register_user_login')
export class RegisterUserLogin {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  business_email: string;

  @Column()
  phone_number: string;

  @Column()
  password: string;

  @Column()
  otp: string;

  @Column()
  otp_expiry: Date;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ default: false })
  passwordSet: boolean;

  @Column({ default: 'N' }) // Default to 'N'
  is_primary_user: string;

  @ManyToOne(() => RegisterOrganization, (organization) => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organization: RegisterOrganization;
}
