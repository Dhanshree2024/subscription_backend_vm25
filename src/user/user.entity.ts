import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RegisterOrganization } from '../organization_register/entities/register-organization.entity';
@Entity('register_user_login', { schema: 'public' })
export class User {
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

  @Column({ default: 'N' }) // Default to 'N'
  PasswordReset: string;

  @Column()
  profile_image: string;

  @Column()
  is_active: boolean;

  @ManyToOne(() => RegisterOrganization, (organization) => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organization: RegisterOrganization;




}