import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToMany } from 'typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
import { Permission } from './permissions.entity'; // Assuming you have a Permission entity
import { RoleType } from 'src/roles_permissions/entities/roles_permission.entity';

@Entity('organization_roles')
export class Roles {
  
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id: number;

  @Column({ name: 'role_name' })
  role_name: string;

  @Column({ name: 'role_description' })
  role_description: string;

  @Column({ name: 'created_by' })
  created_by: number;

  @ManyToOne(() => User, user => user.role_id) // Changed to ManyToOne if there are multiple roles created by one user
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

  @Column({ name: 'is_compulsary', type: 'boolean', default: false })
  is_compulsary: boolean;
  
  @Column({ name: 'is_outside_organization', type: 'boolean', default: false })
  is_outside_organization: boolean;

  @OneToMany(() => Permission, permission => permission.role)
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role_id)
  users: User[]; // Add this property for the inverse relationship
  
  @Column({
        type: 'enum',
        enum: RoleType,
        enumName: 'role_type_enum', // name of enum type created in DB
      })
      role_type: RoleType;
}
