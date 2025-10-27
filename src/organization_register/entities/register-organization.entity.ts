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

  @OneToMany(() => RegisterUserLogin, (userLogin) => userLogin.organization)
  users: RegisterUserLogin[];

  @OneToMany(() => OrgSubscription, (subscription) => subscription.organization)
  subscriptions: OrgSubscription[];
}
