import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'pricing', name: 'contact_sales_requests' })
export class ContactSalesRequest {
  @PrimaryGeneratedColumn({ name: 'contact_request_id' })
  contactRequestId: number;

  @Column({ nullable: true })
  plan_id: number;

  @Column({ nullable: true })
  org_id: number;

  // Personal Information
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  // Company Info
  @Column()
  company_name: string;

  @Column({ nullable: true })
  job_title: string;

  @Column()
  company_size_id: number;

  @Column({ nullable: true })
  industry_id: number;

  @Column({ nullable: true })
  budget_range_id: number;

  @Column({ nullable: true })
  implementation_timeline_id: number;

  // Project Info
  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  // System Fields
  @Column({ default: 'Pending' })
  status: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
