import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class OrganizationProfileScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

  async createOrganizationProfileTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
    CREATE TABLE IF NOT EXISTS ${schemaName}.organizational_profile
        (
            organization_profile_id SERIAL PRIMARY KEY,
            org_name character varying(255) COLLATE pg_catalog."default",
            industry_type_id integer,
            organization_location_name character varying(20) COLLATE pg_catalog."default",
            organization_address character varying(500) COLLATE pg_catalog."default",
            city character varying(100) COLLATE pg_catalog."default",
            pincode integer,
            state character varying(100) COLLATE pg_catalog."default",
            country character varying(100) COLLATE pg_catalog."default",
            mobile_number character varying(10) COLLATE pg_catalog."default",
            base_currency character(3) COLLATE pg_catalog."default",
            financial_year character varying(20) COLLATE pg_catalog."default",
            time_zone character varying(50) COLLATE pg_catalog."default",
            website_url character varying(255) COLLATE pg_catalog."default",
            gst_no character varying(20) COLLATE pg_catalog."default",
            report_basis character varying(20) COLLATE pg_catalog."default",
            tenant_org_id integer,
            created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            established_date date,
            street text COLLATE pg_catalog."default",
            landmark text COLLATE pg_catalog."default",
            email character varying(200) COLLATE pg_catalog."default",
            pf_number character varying(100) COLLATE pg_catalog."default",
            tan_number character varying(100) COLLATE pg_catalog."default",
            pan_number character varying(100) COLLATE pg_catalog."default",
            lin_number character varying(100) COLLATE pg_catalog."default",
            esi_number character varying(100) COLLATE pg_catalog."default",
            dateformat character varying(20) COLLATE pg_catalog."default",
            org_alt_contact_number character varying(10) COLLATE pg_catalog."default",
            org_profile_image_address text COLLATE pg_catalog."default",
            "billingContactName" character varying(200) COLLATE pg_catalog."default",
            "billingContactPhone" character varying(10) COLLATE pg_catalog."default",
            "themeMode" text COLLATE pg_catalog."default",
            "customThemeColor" text COLLATE pg_catalog."default",
            logo text COLLATE pg_catalog."default",
            "billingContactEmail" character varying(200) COLLATE pg_catalog."default",
            desg_description text COLLATE pg_catalog."default",
            CONSTRAINT organizational_profile_tenant_org_id_fkey FOREIGN KEY (tenant_org_id)
                REFERENCES public.register_organization (organization_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION
        )
          `);
  }

  async insertOrganizationProfileTable(schemaName: string, user): Promise<void> {
    // Insert the user's info into the organization's schema user table
    const profileInsertQuery = `
            INSERT INTO ${schemaName}.organizational_profile
            (org_name, tenant_org_id,industry_type_id)
            VALUES ($1, $2,$3);
        `;
    await this.dataSource.query(profileInsertQuery, [
      user.organization.organization_name,
      user.organization.organization_id,
      user.organization.industry_type_id
    ]);
  }
}