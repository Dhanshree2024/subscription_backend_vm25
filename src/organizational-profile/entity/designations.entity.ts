import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { User } from './organizational-user.entity';
import { Department } from './department.entity';
@Entity('designations')
export class Designations {
  
  @PrimaryGeneratedColumn({ name: 'designation_id' })
  designation_id: number;

  @Column({ name: 'designation_name' })
  designation_name: string;

  @Column({ name: 'created_by_id' })
  created_by_id: number;

   @Column({ name: 'desg_description' })
  desg_description: string;

   @Column({ name: 'parent_department' })
  parent_department: number;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'parent_department' })
  parentDepartment: User; // User who created the department


  @OneToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
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