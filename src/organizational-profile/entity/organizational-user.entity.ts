// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { OrganizationalProfile } from './organizational-profile.entity';
import { Department } from './department.entity';
import { Branch } from './branches.entity';
import { Roles } from './roles.entity';
import { Designations } from './designations.entity';
import { RegisterOrganization } from 'src/organization_register/entities/register-organization.entity';
import { RegisterUserLogin } from 'src/organization_register/entities/register-user-login.entity';
import { AssetMappingRepository } from 'src/asset-mapping/entities/asset-mapping.entity';
import { IsOptional } from 'class-validator';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  users_business_email: string;

  @Column()
  phone_number: string;

  @Column()
  password: string;

  @Column()
  organization_id: number; // Corresponds to tenant_org_id in organizational_profile

  @ManyToOne(() => OrganizationalProfile, (org) => org.users)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'tenant_org_id',
  })
  organization: OrganizationalProfile; // Many-to-one relationship with organizational_profile

  @OneToMany(() => Department, (department) => department.createdBy)
  createdDepartments: Department[]; // Add this property for departments created by the user

  @OneToMany(() => Department, (department) => department.departmentHead)
  headDepartments: Department[]; // Add this property for departments headed by the user

  @Column({ default: 'N' })
  is_primary_user: string;

  @Column()
  middle_name: string;

  @Column()
  user_alternative_contact_number: string;

  @Column()
  street: string;

  @Column()
  landmark: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zip: string;

  @Column()
  country: string;

  @Column('integer', { array: true })
  branches: number[];

  @Column()
  created_by: number;

  @ManyToOne(() => RegisterUserLogin)
  @JoinColumn({ name: 'created_by' })
  added_by_user: RegisterUserLogin;

  @Column()
  is_active: number;

  @Column()
  is_deleted: number;

  // @OneToOne(() => Branch)
  // @JoinColumn({ name: 'branches' })
  // user_branch: Branch;

  @OneToOne(() => Branch, (branch) => branch.primaryUser)
  branchAsPrimary: Branch;

  @Column()
  register_user_login_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_login: Date;

  @Column()
  role_id: number;

  @Column()
  @IsOptional()
  department_id: number;

  @Column()
  designation_id: number;

  @Column()
  profile_image: string;

  @OneToOne(() => Roles)
  @JoinColumn({ name: 'role_id' })
  user_role: Roles;

  @OneToOne(() => Designations)
  @JoinColumn({ name: 'designation_id' })
  user_designation: Designations;

  @OneToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  user_department: Department;

  @OneToMany(() => AssetMappingRepository, (mapped) => mapped.user)
  assets_mapped: AssetMappingRepository[]; // Add this property for departments created by the user

  @ManyToOne(
    () => RegisterUserLogin,
    (registeruserlogin) => registeruserlogin.users,
  )
  @JoinColumn({
    name: 'register_user_login_id',
    referencedColumnName: 'user_id',
  })
  userLogintable: RegisterUserLogin;

  @Column()
  is_department_head: boolean

}