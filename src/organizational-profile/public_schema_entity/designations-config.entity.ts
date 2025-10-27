import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('designation_config', { schema: 'public' })
export class DesignationsConfig {
    @PrimaryGeneratedColumn({ name: 'designation_id' })
    designationId: number;

    @Column({ name: 'designation_name', type: 'varchar', length: 150, unique: true })
    designationName: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;
}