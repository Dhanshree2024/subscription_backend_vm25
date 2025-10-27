import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, CreateDateColumn, UpdateDateColumn, Unique,JoinColumn
  } from 'typeorm';
  import { Plan } from './plan.entity';
  import { SubscriptionType } from './subscription-type.entity';
  @Entity({ name: 'plan_billings', schema: 'pricing' })
  @Unique(['plan', 'billing_cycle'])
  export class PlanBilling {
    @PrimaryGeneratedColumn()
    billing_id: number;
  
    // @Column({ type: 'varchar', length: 50 })
    // billing_cycle: 'monthly' | 'yearly';
    @Column({ type: 'varchar', length: 50 })
    billing_cycle: string;

  
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    price: number;
  
    @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
    discounted_percentage: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

        
    @ManyToOne(() => Plan, plan => plan.billings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'plan_id' }) 
    plan: Plan;

  @Column({ type: 'int' })
  subscription_type_id: number;

  @ManyToOne(() => SubscriptionType, { eager: true })
  @JoinColumn({ name: 'subscription_type_id', referencedColumnName: 'type_id' }) // 👈 FIX
  subscriptionType: SubscriptionType;

}
  