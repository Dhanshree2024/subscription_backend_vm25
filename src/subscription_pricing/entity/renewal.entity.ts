import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'pricing', name: 'renewal_status' })
export class RenewalStatus {
  @PrimaryGeneratedColumn({ name: 'status_id' })
  status_id: number;

  @Column({ name: 'status_name', type: 'varchar', length: 255 })
  status_name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;
}
