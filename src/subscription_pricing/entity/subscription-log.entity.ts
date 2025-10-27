import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { OrgSubscription } from './org_subscription.entity';
  
  @Entity({ name: 'subscription_log', schema: 'pricing' })
  export class SubscriptionLog {
    @PrimaryGeneratedColumn()
    log_id: number;
  
    @Column()
    subscription_id: number;
  
    @Column()
    organization_profile_id: number;
  
    @Column({ type: 'varchar', length: 20 })
    action: 'create' | 'update' | 'cancel';
  
    @Column({ type: 'json', nullable: true })
    old_data: any;
  
    @Column({ type: 'json', nullable: true })
    new_data: any;
  
    @Column({ type: 'text', nullable: true })
    remarks: string;
  
    @Column()
    performed_by: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @ManyToOne(() => OrgSubscription)
    @JoinColumn({ name: 'subscription_id' })
    subscription: OrgSubscription;
  }
  