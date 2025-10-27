import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  import { OrgSubscription } from "./org_subscription.entity";
  import { BillingInfo } from "./billing_info.entity";
  import { Plan } from "./plan.entity";
  
  @Entity("offline_payment_requests", { schema: "pricing" })
  export class OfflinePaymentRequest {
    @PrimaryGeneratedColumn()
    request_id: number;
  
    @Column()
    subscription_id: number;
  
    @ManyToOne(() => OrgSubscription, (sub) => sub.offlineRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "subscription_id" })
    orgSubscription: OrgSubscription;
  
    @Column()
    billing_id: number;
  
    @ManyToOne(() => BillingInfo, (billing) => billing.offlineRequests)
    @JoinColumn({ name: "billing_id" })
    billingInfo: BillingInfo;
  
    @Column()
    plan_id: number;
  
    @ManyToOne(() => Plan, (plan) => plan.offlineRequests)
    @JoinColumn({ name: "plan_id" })
    plan: Plan;
  
    @Column({
      type: "varchar",
      length: 50,
      default: "pending",
    })
    status: "pending" | "approved" | "rejected";
  
    @Column({ type: "numeric", precision: 10, scale: 2 })
    amount: number;
  
    @Column({ type: "varchar", length: 10, default: "USD" })
    currency: string;
  
    @Column({ type: "text", nullable: true })
    reference_note: string; // e.g., "Bank transfer receipt #123"
  
    @CreateDateColumn({ type: "timestamp" })
    requested_at: Date;
  
    @UpdateDateColumn({ type: "timestamp" })
    updated_at: Date;
  
    @Column({ type: "timestamp", nullable: true })
    processed_at: Date;
  
    @Column()
    created_by: number;
  
    @Column({ nullable: true })
    approved_by: number;
  }
  