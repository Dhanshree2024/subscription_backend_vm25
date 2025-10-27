import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, CreateDateColumn, UpdateDateColumn,
    JoinColumn, OneToMany
  } from 'typeorm';
  import { Plan } from './plan.entity';
  import { PlanBilling } from './plan-billing.entity';
  import { SubscriptionType } from './subscription-type.entity';
  import { Feature } from './feature.entity';
  import { BillingInfo } from './billing_info.entity';
  import { PaymentTransaction } from './payment_transaction.entity';
import { OfflinePaymentRequest } from './offline_payment_requests.entity';
import {RegisterOrganization } from '../../organization_register/entities/register-organization.entity';
import { Product } from './product.entity'; 
import { RenewalStatus } from './renewal.entity'; // Import your entity

  @Entity('org_subscriptions', { schema: 'pricing' })
  export class OrgSubscription {
    @PrimaryGeneratedColumn()
    subscription_id: number;
  
    @Column()
    organization_profile_id: number;
  
    @Column()
    plan_id: number;
  
    @Column()
    billing_id: number;
  
    @Column({ type: 'varchar' })
    plan_billing_id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    sub_billing_id: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    sub_order_id: string;

    @Column()
    subscription_type_id: number;
  
    @Column({ type: 'timestamp' })
    start_date: Date;
  
    @Column({ type: 'timestamp' })
    renewal_date: Date;
  
    @Column({ type: 'varchar', length: 50 })
    payment_status: 'pending' | 'completed' | 'failed';
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    payment_mode: string;
  
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    price: number;
  
    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
    discounted_price: number;
  
    @Column({ type: 'numeric', precision: 10, scale: 2 })
    grand_total: number;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    license_no: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    invoice_number: string;
  
    @Column({ default: true })
    is_active: boolean;  // Whether the asset is active
  
    @Column({ default: false })
    is_deleted: boolean;  // Whether the asset is deleted
    // @Column()
    // feature_id: number;
    @Column({ default: false })
    is_trial_period: boolean;  

    @Column()
    created_by: number;
 
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    purchase_date: Date;

    @Column({ default: false })
    auto_renewal: boolean; 

    @Column({ default: false })
    is_activated: boolean;  // Whether the asset is deleted

    @Column({ name: 'product_id'})
    productId: number;

    @Column({ name: 'renewal_status', nullable: true })
    renewal_status: number;

    @Column({ type: 'varchar', length: 10, nullable: true })
    trial_period_unit: 'days' | 'months' | 'years'; // Unit of the trial period

    @Column({ type: 'int', nullable: true })
    trial_period_count: number; // Number of units

    @Column({ type: 'timestamp', nullable: true })
    trial_start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    trial_expiry_date: Date;

    @Column({ type: 'int', nullable: true })
    grace_period: number; // Grace period in days

    @Column({ default: false })
    restrict_login: boolean; 

    @Column({ type: 'numeric', nullable: true })
    percentage: number;

    @ManyToOne(() => Plan, plan => plan.subscriptions)
    @JoinColumn({ name: 'plan_id' }) 
    plan: Plan;

    // @ManyToOne(() => Feature)
    // @JoinColumn({ name: 'feature_id', referencedColumnName: 'feature_id' })
    // feature: Feature;

    @ManyToOne(() => SubscriptionType, type => type.subscriptions)
    @JoinColumn({ name: 'subscription_type_id', referencedColumnName: 'type_id' })
    subscriptionType: SubscriptionType;

    @OneToMany(() => BillingInfo, (billing) => billing.orgSubscription)   
    billingInfo: BillingInfo[];
    
    @OneToMany(() => PaymentTransaction, (payment) => payment.orgSubscription)  
    paymentTransactions: PaymentTransaction[];

    @OneToMany(() => OfflinePaymentRequest, (request) => request.orgSubscription)
    offlineRequests: OfflinePaymentRequest[];
    
    @ManyToOne(() => RegisterOrganization, (organization) => organization.subscriptions, { eager: false })
    @JoinColumn({ name: 'organization_profile_id' })  // FK column in subscription table
    organization: RegisterOrganization;

    @ManyToOne(() => Product, product => product.plans) // or product.billingInfos
    @JoinColumn({ name: 'product_id' }) // FK in OrgSubscription table
    product: Product;

      @ManyToOne(() => RenewalStatus, { eager: true }) // eager loads the status
  @JoinColumn({ name: 'renewal_status' })
  renewalStatus: RenewalStatus;
  }
  