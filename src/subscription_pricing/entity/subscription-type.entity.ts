import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrgSubscription } from './org_subscription.entity';

@Entity({ name: 'subscription_types', schema: 'pricing' })
export class SubscriptionType {
  @PrimaryGeneratedColumn()
  type_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  type_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  created_by: number;

  @OneToMany(() => OrgSubscription, subscription => subscription.subscriptionType)
  subscriptions: OrgSubscription[];

}
