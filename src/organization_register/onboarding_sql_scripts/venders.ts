import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class VendersScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




  async createVendersTable(schemaName: string): Promise<void> {

    await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.vendors
        (
            vendor_id SERIAL PRIMARY KEY,
            vendor_name text COLLATE pg_catalog."default",
            vendor_gst_no text COLLATE pg_catalog."default",
            vendor_street text COLLATE pg_catalog."default",
            vendor_landmark text COLLATE pg_catalog."default",
            vendor_city text COLLATE pg_catalog."default",
            vendor_state text COLLATE pg_catalog."default",
            vendor_country text COLLATE pg_catalog."default",
            vendor_contact_number text COLLATE pg_catalog."default",
            vendor_alternative_contact_number text COLLATE pg_catalog."default",
            vendor_email text COLLATE pg_catalog."default",
            is_active smallint DEFAULT 1,
            is_deleted smallint DEFAULT 0,
            created_at timestamp without time zone DEFAULT now(),
            vendor_pincode text COLLATE pg_catalog."default",
            vendor_primary_contact text COLLATE pg_catalog."default",
            created_by integer,
            vendor_first_name text COLLATE pg_catalog."default",
            vendor_middle_name text COLLATE pg_catalog."default",
            vendor_last_name text COLLATE pg_catalog."default",
            vendor_degination text COLLATE pg_catalog."default",
            vendor_department text COLLATE pg_catalog."default",
            vendor_display_name text COLLATE pg_catalog."default",
            vendor_gst_status text COLLATE pg_catalog."default",
            updated_at timestamp without time zone DEFAULT now()
            
        )
 `);
  }

}