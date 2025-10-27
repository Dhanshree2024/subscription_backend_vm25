import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PlanBilling } from './plan-billing.entity';
import { PlanFeatureMapping } from './plan-feature-mapping.entity';
import { OrgSubscription } from './org_subscription.entity';
import { PlanSetting } from './plan_setting.entity';
import { OfflinePaymentRequest } from './offline_payment_requests.entity'
import { Product } from './product.entity';

@Entity({ name: 'plans', schema: 'pricing' })
export class Plan {
  @PrimaryGeneratedColumn()
  plan_id: number;

  @Column({ type: 'varchar', length: 255 })
  plan_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ default: true })
  is_active: boolean;  

  @Column({ default: false })
  is_deleted: boolean;  

  @Column({ default: false })
  set_trial: boolean;  

    // ✅ Trial Type: "free" | "paid"
  @Column({ type: 'varchar', length: 50, nullable: true })
  trial_type: string;

  // ✅ Trial Period Duration (e.g. 15 days)
  @Column({ type: 'int', nullable: true })
  trial_period: number;

  // ✅ Trial Period Unit (e.g. "days", "weeks")
  @Column({ type: 'varchar', length: 50, nullable: true })
  trial_period_unit: string;

  // ✅ Trial Count (e.g. number of times the trial can be activated)
  @Column({ type: 'int', nullable: true })
  trial_period_count: number;

  // ✅ Trial Amount (for paid trials)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  trial_amount: number;

  @OneToMany(() => PlanBilling, billing => billing.plan)
  billings: PlanBilling[];

  @OneToMany(() => PlanFeatureMapping, mapping => mapping.plan)
  featureMappings: PlanFeatureMapping[];

  @OneToMany(() => OrgSubscription, subscription => subscription.plan)
  subscriptions: OrgSubscription[];

  @OneToMany(() => PlanSetting, (setting) => setting.plan)
  settings: PlanSetting[];

  @OneToMany(() => OfflinePaymentRequest, (request) => request.plan)
  offlineRequests: OfflinePaymentRequest[];

  @Column({ name: 'product_id', nullable: true })
  productId: number;

  @ManyToOne(() => Product, (product) => product.plans, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

}
