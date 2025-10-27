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
            CREATE TABLE IF NOT EXISTS ${schemaName}.organizational_profile (
              organization_profile_id SERIAL PRIMARY KEY,
              org_name VARCHAR(255),
              industry_type_name VARCHAR(50),
              organization_location_name VARCHAR(20),
              organization_address VARCHAR(500),
              city VARCHAR(100),
              pincode INT CHECK (pincode >= 100000 AND pincode <= 999999),
              state VARCHAR(100),
              country VARCHAR(100),
              mobile_number VARCHAR(10) CHECK (mobile_number ~ '^\d{10}$'),
              base_currency CHAR(3),
              financial_year VARCHAR(20),
              time_zone VARCHAR(50),
              website_url VARCHAR(255),
              gst_no VARCHAR(20),
              report_basis VARCHAR(20) CHECK (report_basis IN ('Accrual', 'Cash')),
              tenant_org_id INT REFERENCES public.register_organization(organization_id),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `);
    }

    async  insertOrganizationProfileTable(schemaName: string,user): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const profileInsertQuery = `
            INSERT INTO ${schemaName}.organizational_profile 
            (org_name, tenant_org_id)
            VALUES ($1, $2);
        `;
            await this.dataSource.query(profileInsertQuery, [
            user.organization.organization_name,
            user.organization.organization_id,
            ]);
    }
}