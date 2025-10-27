import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Subscription } from './subscription.entity';
  
  @Entity('plans', { schema: 'public' })
  export class Plan {
    @PrimaryGeneratedColumn()
    plan_id: number;
  
    @Column({ length: 255 })
    plan_name: string;
  
    @Column({ type: 'numeric' })
    price: number;
  
    @Column({ type: 'jsonb' })
    features: Record<string, any>;
  
    @Column({ length: 20 })
    billing_cycle: string;
  
    // @Column()
    // duration_months: number;
  
    @Column({ type: 'integer' })
    user_limit: number;

    @Column({type: 'bigint'})
    storage_limit_gb: number;

    @Column({type: 'integer'})
    department_limit: number;
  

    @Column({type: 'integer'})
    destination_limit: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @Column()
    branch_limit: number;
  
    @Column()
    location_limit: number;
  
    @Column()
    employee_limit: number;

    @Column({ type: 'numeric', nullable: true })
    discounted_percentage: number;
  
    @OneToMany(() => Subscription, (subscription) => subscription.plan)
    subscriptions: Subscription[];
  }
  