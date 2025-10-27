import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Roles } from './role.entity'; // Correctly referencing Roles Entity

@Entity('organization_permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  permission_id: number;

  @Column()
  role_id: number; // Foreign key to Roles table

  @Column({ type: 'jsonb', default: [] })
  permissions: Record<string, any>; // Define JSONB as an object

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  // ✅ ManyToOne relation with Roles
  @ManyToOne(() => Roles, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: Roles;
}
