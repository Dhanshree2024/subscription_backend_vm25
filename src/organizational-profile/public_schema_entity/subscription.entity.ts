import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Plan } from './plan.entity';

@Entity('subscriptions', { schema: 'public' })

export class Subscription {
  @PrimaryGeneratedColumn()
  subscription_id: number;

  @Column()
  organization_profile_id: number;

  @ManyToOne(() => Plan, (plan) => plan.plan_id)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column()
  payment_status: string;

  @Column()
  payment_mode: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions_features: Record<string, any>;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  renewal_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 50, nullable: true })
  license_no: string;

  @Column({ length: 50, nullable: true })
  invoice_number: string;

  @Column({ type: 'numeric' })
  price: number;

  @Column({ type: 'numeric', nullable: true })
  discounted_price: number;

  @Column({ type: 'numeric', nullable: true })
  discounted_percentage: number;

  @Column({ type: 'numeric' })
  grand_total: number;
}
