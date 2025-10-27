import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
  } from 'typeorm';
  
  @Entity({ schema: 'pricing', name: 'payment_methods' })

  export class PaymentMethod {
    @PrimaryGeneratedColumn({ name: 'method_id' })
    methodId: number;
  
    @Column({ name: 'method_name', type: 'varchar', length: 100 })
    methodName: string;
  
    @Column({ name: 'method_code', type: 'varchar', length: 50 })
    methodCode: string;
  
    @Column({ name: 'provider', type: 'varchar', length: 100, nullable: true })
    provider: string | null;
  
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;
  
    @Column({ name: 'display_order', type: 'int', default: 0 })
    displayOrder: number;
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
  }
  