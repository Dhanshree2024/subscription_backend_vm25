import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { PermissionsRoles } from './permissions.entity';


export enum RoleType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}
@Entity('organization_roles')
export class RolesPermission {
  
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id: number;

  @Column({ name: 'role_name' })
  role_name: string;

  @Column({ name: 'created_by' })
  created_by: number;

   @Column({ name: 'role_description' })
  role_description: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User; // User who created the department

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Add new fields for deleted and active status
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => PermissionsRoles, (permission) => permission.role)
  permissions: PermissionsRoles[];
 
  @Column({ name: 'is_compulsary', type: 'boolean', default: false })
  is_compulsary: boolean;
  
  @Column({ name: 'is_outside_organization', type: 'boolean', default: false })
  is_outside_organization: boolean;
  
   @Column({
      type: 'enum',
      enum: RoleType,
      enumName: 'role_type_enum', // name of enum type created in DB
    })
    role_type: RoleType;
}