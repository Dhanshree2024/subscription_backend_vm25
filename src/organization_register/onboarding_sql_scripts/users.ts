import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  ExecutionContext,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';

@Injectable()
export class UserScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

  async createUserTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.users
      (
          user_id SERIAL PRIMARY KEY,
          first_name character varying(255) COLLATE pg_catalog."default",
          middle_name character varying(255) COLLATE pg_catalog."default",
          last_name character varying(255) COLLATE pg_catalog."default",
          date_of_birth date,
          gender character(1) COLLATE pg_catalog."default",
          blood_group character varying(5) COLLATE pg_catalog."default",
          users_business_email character varying(255) COLLATE pg_catalog."default",
          phone_number character varying(50) COLLATE pg_catalog."default",
          street text COLLATE pg_catalog."default",
          landmark text COLLATE pg_catalog."default",
          city character varying(100) COLLATE pg_catalog."default",
          state character varying(100) COLLATE pg_catalog."default",
          zip character varying(20) COLLATE pg_catalog."default",
          country character varying(100) COLLATE pg_catalog."default",
          password character varying(255) COLLATE pg_catalog."default",
          is_primary_user character(1) COLLATE pg_catalog."default" DEFAULT 'N'::bpchar,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          organization_id integer,
          register_user_login_id integer,
          user_alternative_contact_number character varying(50) COLLATE pg_catalog."default",
          role_id integer,
          department_id integer,
          designation_id integer,
          profile_image text COLLATE pg_catalog."default",
          created_by integer,
          last_login timestamp without time zone,
          is_active integer DEFAULT 1,
          is_deleted integer DEFAULT 0,
          is_department_head boolean DEFAULT false,
          branches integer[],
          
          CONSTRAINT users_business_email_key UNIQUE (users_business_email),
          CONSTRAINT department_id FOREIGN KEY (department_id)
              REFERENCES ${schemaName}.departments (department_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE NO ACTION,
          CONSTRAINT role_id FOREIGN KEY (role_id)
              REFERENCES ${schemaName}.organization_roles (role_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE NO ACTION,
          CONSTRAINT users_designation_id_fkey FOREIGN KEY (designation_id)
              REFERENCES ${schemaName}.designations (designation_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE NO ACTION,
          CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id)
              REFERENCES public.register_organization (organization_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE NO ACTION,
          CONSTRAINT users_register_user_login_id_fkey FOREIGN KEY (register_user_login_id)
              REFERENCES public.register_user_login (user_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE NO ACTION
      )`);
  }

  async insertUserTable(schemaName: string, user): Promise<boolean> {
    // Insert the user's info into the organization's schema user table

    // const randomPassword = Math.random().toString(36).slice(-8);
    const userInsertQuery = `
        INSERT INTO ${schemaName}.users
        (first_name, last_name, users_business_email, phone_number, password, organization_id, register_user_login_id, is_primary_user,role_id,department_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`;

    await this.dataSource.query(userInsertQuery, [
      user.first_name,
      user.last_name,
      user.business_email,
      user.phone_number,
      user.password,
      user.organization.organization_id,
      user.user_id,
      'Y',
      user.role_id,
      user.department_id,
    ]);

    return true;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
