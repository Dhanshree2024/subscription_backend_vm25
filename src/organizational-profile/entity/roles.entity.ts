import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToOne } from 'typeorm';
import { User } from './organizational-user.entity';




////// this code is not used for imp APIS , might delete soon
@Entity('organization_roles')
export class Roles {
  
  @PrimaryGeneratedColumn({ name: 'role_id' })
  role_id: number;

  @Column({ name: 'role_name' })
  role_name: string;

  @Column({ name: 'created_by' })
  created_by: number;

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
}