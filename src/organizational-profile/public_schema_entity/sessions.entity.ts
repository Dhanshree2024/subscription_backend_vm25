import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sessions', { schema: 'public' })
export class Session {
    @Column({ type: 'bigint' })
    user_id: number;

    @PrimaryGeneratedColumn('uuid')
    session_id: string;

    @Column({ nullable: true })
    device_name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    device_type: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';

    @Column({ nullable: true })
    ip_address: string;

    @Column({ nullable: true })
    location: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_blocked: boolean;

    @Column({ type: 'timestamp', nullable: true })
    login_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    last_seen: Date;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    logout_at: Date;

    @Column({ type: 'text', nullable: true })
    refresh_token: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({ default: 0 })
    is_deleted: number;
}