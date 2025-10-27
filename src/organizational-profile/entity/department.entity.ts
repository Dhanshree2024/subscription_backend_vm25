import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, OneToOne } from 'typeorm';
import { User } from './organizational-user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn({ name: 'department_id' })
  departmentId: number;

  @OneToOne(() => User, (user) => user.createdDepartments)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User; // User who created the department

  @OneToOne(() => User, (user) => user.headDepartments)
  @JoinColumn({ name: 'department_head_id' })
  departmentHead: User; // User who heads the department

  @Column({ name: 'department_name' })
  departmentName: string;
  
  @Column({ name: 'department_head_id' })
  departmentHeadId: string;
  
   @Column({ name: 'dept_description' })
  dept_description: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Add new fields for deleted and active status
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  deleted: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
    linked_designations: number[]| null;
 
}