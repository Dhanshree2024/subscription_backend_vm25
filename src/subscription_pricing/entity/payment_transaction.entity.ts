import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrgSubscription } from '../entity/org_subscription.entity';
import { PaymentMethod } from '../entity/payment_methods.entity';

@Entity('payment_transaction', { schema: 'pricing' })
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  transaction_id: number;

  @Column()
  org_subscription_id: number;

  @ManyToOne(() => OrgSubscription, (sub) => sub.paymentTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_subscription_id' })
  orgSubscription: OrgSubscription;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'INR' })
  currency: string;

  // @Column({ length: 50, nullable: true })
  // payment_method: string;
  @Column({ type: 'int', nullable: false })
payment_method: number;


  @Column({ length: 4, nullable: true })
  card_last4: string;

  @Column({ length: 7, nullable: true })
  card_expiry: string; // format MM/YYYY

  @Column({ length: 100, nullable: true })
  card_holder_name: string;

  @Column({ length: 20 })
  transaction_status: string;

  @Column({ length: 255, nullable: true })
  transaction_reference: string;
  
  @Column({ name: 'method_id', type: 'int', nullable: true }) // 👈 add this
  methodId: number;

  @ManyToOne(() => PaymentMethod, { eager: true })
  @JoinColumn({ name: 'method_id', referencedColumnName: 'methodId' })
  method: PaymentMethod;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paid_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
