import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RegisterUserLogin } from './register-user-login.entity';
import { OrgSubscription } from 'src/subscription_pricing/entity/org_subscription.entity';

@Entity('register_organization', { schema: 'public' })
export class RegisterOrganization {
  @PrimaryGeneratedColumn()
  organization_id: number;

  @Column()
  organization_name: string;

  @Column()
  organization_schema_name: string;

  @Column()
  industry_type_id: number;

  @Column({ name: 'customer_id', type: 'varchar', length: 100, nullable: true })
  customer_id?: string;

  @Column({ name: 'payment_term', type: 'varchar', length: 50, nullable: true })
  payment_term?: string;

  @Column({ name: 'gst_registered', type: 'boolean', default: false })
  gst_registered: boolean;

  @Column({ name: 'gst_number', type: 'varchar', length: 30, nullable: true })
  gst_number?: string;

  @Column({ name: 'status', type: 'boolean', default: true })
  status: boolean;

  @OneToMany(() => RegisterUserLogin, (userLogin) => userLogin.organization)
  users: RegisterUserLogin[];

  @OneToMany(() => OrgSubscription, (subscription) => subscription.organization)
  subscriptions: OrgSubscription[];
}
