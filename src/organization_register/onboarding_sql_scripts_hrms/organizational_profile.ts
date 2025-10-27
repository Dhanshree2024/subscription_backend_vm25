import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm'; 
 
@Injectable()
export class OrganizationProfileScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createOrganizationProfileTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS ${schemaName}.organizational_profile (
              organization_profile_id SERIAL PRIMARY KEY,
              organization_name VARCHAR(255) NOT NULL, -- Organization Name
              industry_type_name VARCHAR(50),
              organization_location_name VARCHAR(20),
              organization_address VARCHAR(500),
              landmark VARCHAR(255),
              street VARCHAR(255),
              city VARCHAR(100),
              pincode INT,
              state VARCHAR(100),
              country VARCHAR(100),
              organization_mobile_number VARCHAR(10),
              base_currency CHAR(3),
              financial_year VARCHAR(20),
              time_zone VARCHAR(50),
              website_url VARCHAR(255),
              gst_no VARCHAR(20),
              pf_no VARCHAR(20), -- Added PF Number
              tan_no VARCHAR(20), -- Added TAN Number
              pan_no VARCHAR(20), -- Added PAN Number
              esi_no VARCHAR(20), -- Added ESI Number
              lin_no VARCHAR(20), -- Added LIN Number
              tenant_org_id INT NOT NULL, -- Foreign Key to Tenant Organization
              created_by INT, -- Added Created By (can reference users table)
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              alternative_contact VARCHAR(50),
              organization_email VARCHAR(255),
              established_date Date,
              dateformat VARCHAR(15),
              profile_image TEXT NULL,
              holiday_year character varying(50),
              latitude DECIMAL(10, 7),
              longitude DECIMAL(10, 7),
              CONSTRAINT fk_tenant_org FOREIGN KEY (tenant_org_id) REFERENCES public.register_organization (organization_id) -- Foreign Key Constraint

            );

          `);
    }
 
    async  insertOrganizationProfileTable(schemaName: string,user): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const profileInsertQuery = `
            INSERT INTO ${schemaName}.organizational_profile
            (organization_name, tenant_org_id, industry_type_name)
            VALUES ($1, $2, $3);
        `;
            await this.dataSource.query(profileInsertQuery, [
            user.organization.organization_name,
            user.organization.organization_id,
            user.organization.industry_type_name,

            ]);
    }
}