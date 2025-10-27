import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Branch } from './branches.entity';

@Entity('asset_locations')
export class Locations {

    @PrimaryGeneratedColumn()
    location_id: number;
    
    @Column()
    location_name: string

    @Column()
    branch_id: number

    @Column()
    department_id: number

    @Column()
    location_floor_room: string

    @Column()
    location_code: string

    @Column()
    location_city: string

    @Column()
    location_state: string

    @Column({ default: 0 })
    location_total_asset: number;

    @Column()
    location_street_address: string

    @Column()
    location_description: string

    @Column()
    location_google_map_pin: string

    @Column()
    created_at: Date;

    @Column()
    updated_at: Date;

    @Column()
    created_by: number;

    @Column()
    updated_by: number;
    
    @Column({ default: 1 })
    is_active: number
    
    @Column({ default: 0 })
    is_deleted: number
    
    // Join
    @OneToOne(() => Branch)
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;
    
    
}