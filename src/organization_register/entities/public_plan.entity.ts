import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,OneToMany } from 'typeorm';
import { Subscription } from './public_subscription.entity';

@Entity('plans', { schema: 'public' })
export class Plan {
  @PrimaryGeneratedColumn()
  plan_id: number;

  @Column({ type: 'varchar', length: 255 })
  plan_name: string;

  @Column({ type: 'numeric' })
  price: number;

  @Column({ type: 'jsonb' })
  features: object;

  @Column({ type: 'varchar', length: 20 })
  billing_cycle: string;

  @Column({ type: 'int' })
  user_limit: number;

  @Column({ type: 'bigint' })
  storage_limit_gb: number;

  @Column({ type: 'int' })
  department_limit: number;

  @Column({ type: 'int' })
  destination_limit: number;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updated_at: Date;

  @Column({ type: 'int' })
  branch_limit: number;

  @Column({ type: 'int' })
  location_limit: number;

  @Column({ type: 'int' })
  employee_limit: number;

  @Column({type: 'numeric'})
  discounted_percentage: number;
  
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
