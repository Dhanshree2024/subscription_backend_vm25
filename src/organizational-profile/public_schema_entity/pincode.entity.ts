import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('post_pincodes', { schema: 'public' })
export class Pincodes {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10 })
    pincode: string;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'varchar', length: 100 })
    state: string;

    @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
    longitude: number;

    @Column({ type: 'numeric', precision: 10, scale: 6, nullable: true })
    latitude: number;
}