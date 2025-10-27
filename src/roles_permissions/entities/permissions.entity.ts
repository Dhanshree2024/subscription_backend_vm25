import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToOne } from 'typeorm';
import { RolesPermission } from './roles_permission.entity';

@Entity('organization_permissions')
export class PermissionsRoles {
  
  @PrimaryGeneratedColumn({ name: 'permission_id' })
  permission_id: number;

  @Column({ name: 'role_id' })
  role_id: number;

  @Column({ type: 'jsonb' })
  permissions: any;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Add new fields for deleted and active status
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => RolesPermission, (role) => role.permissions)
  @JoinColumn({ name: 'role_id' }) // Specify the exact foreign key column name
  role: RolesPermission;

}