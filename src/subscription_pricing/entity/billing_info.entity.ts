import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { OrgSubscription } from '../entity/org_subscription.entity';
import { OfflinePaymentRequest } from './offline_payment_requests.entity'
import { PaymentMethod } from './payment_methods.entity';
import { Product } from './product.entity';
@Entity('billing_info', { schema: 'pricing' })
export class BillingInfo {
  @PrimaryGeneratedColumn()
  billing_id: number;

  // @Column() // explicitly define the FK column
  // org_subscription_id: number;
  @Column({ type: 'int', nullable: true })
org_subscription_id?: number;

  @ManyToOne(() => OrgSubscription, (sub) => sub.billingInfo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_subscription_id' })
  orgSubscription: OrgSubscription;
  
  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100, nullable: true })
  last_name: string;

  @Column({ length: 150 })
  email: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Column({ length: 255, nullable: true })
  company_name: string;

  @Column({ length: 255 })
  address_line1: string;

  @Column({ length: 255, nullable: true })
  address_line2: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  postal_code: string;

  @Column({ length: 100 })
  country: string;

  @Column({ length: 50, nullable: true })
  gst_number: string;

  @Column({ length: 50, nullable: true })
  tax_id: string;

  @Column({ length: 20, nullable: true, default: 'pending' })
  status: string;

  @Column({ default: false })
  same_as_primary_contact: boolean;  
  
  @Column({ name: 'method_id', type: 'int', nullable: true }) // 👈 add this
  methodId: number;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'method_id' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  orderplacedby: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentterm: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  customerpo: string;

  @Column({ name: 'product_id'})
  productId: number;

  @OneToMany(() => OfflinePaymentRequest, (request) => request.billingInfo)
  offlineRequests: OfflinePaymentRequest[];

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  

}
