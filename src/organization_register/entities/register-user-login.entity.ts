import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,  // Add this
} from 'typeorm';
import { RegisterOrganization } from './register-organization.entity';
import { IsOptional } from 'class-validator';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';

@Entity('register_user_login', { schema: 'public' })
export class RegisterUserLogin {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true, name: "users_business_email" })
  business_email: string;

  @Column()
  phone_number: string;

  @Column()
  @IsOptional()
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

  @Column()
  username: string;

  @Column({ default: 'N' }) // Default to 'N'
  is_primary_user: string;

  @Column({ default: 'N' }) // Default to 'N'
  passwordReset: string;

  @Column()
  organization_id: number;

  @ManyToOne(() => RegisterOrganization, (organization) => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organization: RegisterOrganization;

  // Add reverse relationship to User
  @OneToMany(() => User, (user) => user.userLogintable)
  users: User[];  // Define the reverse relationship


  @Column()
  is_active: number;

  @Column()
  is_deleted: number;



  @Column()
  org_billing_id: number;












}

