import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn
  } from 'typeorm';
  import { Plan } from './plan.entity';
  
  @Entity({ name: 'plan_setting', schema: 'pricing' })
  export class PlanSetting {
    @PrimaryGeneratedColumn()
    plan_setting_id: number;
  
    @Column()
    plan_id: number;

  
    @Column({ type: 'varchar', length: 100 })
    setting_name: string;
  
    @Column({ type: 'text' })
    value: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ default: true })
    is_active: boolean;
  
    @Column({ default: false })
    is_deleted: boolean;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

      // ✅ Explicitly map FK
  @ManyToOne(() => Plan, (plan) => plan.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' }) // tell TypeORM to use plan_id
  plan: Plan;
  }
  