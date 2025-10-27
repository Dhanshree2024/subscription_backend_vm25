import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('department_config', { schema: 'public' })
export class DepartmentConifg {
    @PrimaryGeneratedColumn({ name: 'department_id' })
    departmentId: number;

    @Column({ name: 'department_name', type: 'varchar', length: 150, unique: true })
    departmentName: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;
}