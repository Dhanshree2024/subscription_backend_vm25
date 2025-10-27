import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RegisterUserLogin } from './register-user-login.entity';

@Entity('register_organization', { schema: 'public' })
export class RegisterOrganization {
  @PrimaryGeneratedColumn()
  organization_id: number;

  @Column()
  organization_name: string;

  @Column()
  organization_schema_name: string;

  @OneToMany(() => RegisterUserLogin, (userLogin) => userLogin.organization)
  users: RegisterUserLogin[];
}
