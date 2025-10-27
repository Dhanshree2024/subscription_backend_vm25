import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Feature } from './feature.entity';
import { Plan } from './plan.entity';
import { PlanFeatureMapping } from './plan-feature-mapping.entity';
import { BillingInfo } from './billing_info.entity';
@Entity({ schema: 'pricing', name: 'products' })
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id' })
  productId: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'varchar', length: 20, name: 'schema_initial', nullable: false })
  schemaInitial: string;

  @OneToMany(() => Feature, feature => feature.product)
  features: Feature[];

  @OneToMany(() => Plan, plans => plans.product)
  plans: Plan[];

  @OneToMany(() => BillingInfo, (billing) => billing.product)
  billingInfos: BillingInfo[];
}
