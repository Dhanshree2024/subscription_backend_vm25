import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('payment_modes', { schema: 'pricing' })
  export class PaymentMode {
    @PrimaryGeneratedColumn()
    payment_mode_id: number;
  
    @Column({ type: 'varchar', length: 50 })
    mode_name: string;
  
    @Column({ type: 'text', nullable: true })
    description?: string;
  
    @Column({ type: 'boolean', default: true })
    is_active: boolean;
  
    @Column({ type: 'boolean', default: false })
    is_deleted: boolean;
  
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
  
    @UpdateDateColumn({
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;
  }
  