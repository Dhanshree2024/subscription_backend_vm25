import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BranchesScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createBranchesTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.branches
(
    branch_id SERIAL PRIMARY KEY,
    branch_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    gst_no character varying(20) COLLATE pg_catalog."default",
    branch_street character varying(500) COLLATE pg_catalog."default",
    city_id integer,
    country_id integer,
    location_id integer,
    primary_user_id integer,
    city character varying(100) COLLATE pg_catalog."default",
    pincode integer,
    state character varying(100) COLLATE pg_catalog."default",
    country character varying(100) COLLATE pg_catalog."default",
    contact_number character varying(10) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_landmark text COLLATE pg_catalog."default",
    alternative_contact_number character varying(10) COLLATE pg_catalog."default",
    branch_email text COLLATE pg_catalog."default",
    created_by integer,
    established_date date,
    is_active integer DEFAULT 1,
    is_deleted integer DEFAULT 0,
    branch_code text COLLATE pg_catalog."default",
    
    CONSTRAINT branches_user_id_fkey FOREIGN KEY (primary_user_id)
        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_user FOREIGN KEY (primary_user_id)
        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
    `);
  }
}
