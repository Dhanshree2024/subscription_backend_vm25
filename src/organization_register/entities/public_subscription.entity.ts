import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Plan } from './public_plan.entity';

@Entity('subscriptions',{ schema: 'public' })
export class Subscription {
  @PrimaryGeneratedColumn()
  subscription_id: number;

  @Column()
  organization_profile_id: number;

  @Column()
  plan_id: number;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'plan_id' })
  plan: Plan;

  @Column()
  payment_status: string;

  @Column()
  payment_mode: string;

  @Column('jsonb', { nullable: true })
  permissions_features: any;

  @Column()
  start_date: Date;

  @Column()
  renewal_date: Date;

  @Column({ nullable: true })
  license_no: string;

  @Column({ nullable: true })
  invoice_number: string;

  @Column('numeric')
  price: number;  // Added price field

  @Column('numeric', { nullable: true })
  discounted_price: number;  // Added discounted price field

  @Column('numeric', { nullable: true })
  discounted_percentage: number;  // Added discounted percentage field

  @Column('numeric')
  grand_total: number;  // Added grand total field

  @Column('timestamp', { nullable: true })
  created_at: Date;

  @Column('timestamp', { nullable: true })
  updated_at: Date;
}
