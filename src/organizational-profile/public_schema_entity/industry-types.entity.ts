import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('industry_type_config', { schema: 'public' })
export class IndustryTypes {
    @PrimaryGeneratedColumn({ name: 'industry_id' })
    industryId: number;

    @Column({ name: 'industry_name', type: 'varchar', length: 150, unique: true })
    industryName: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;
}