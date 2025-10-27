import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class StocksScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




    async createStocksTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
      CREATE TABLE IF NOT EXISTS ${schemaName}.stocks
(
    stock_id SERIAL PRIMARY KEY,
    asset_id integer,
    previous_available_quantity integer,
    total_available_quantity integer,
    description text COLLATE pg_catalog."default",
    vendor_id integer,
    created_by integer,
    updated_by integer,
    is_active integer DEFAULT 1,
    is_deleted integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    asset_ownership_status integer,
    unique_description text COLLATE pg_catalog."default",
    quantity numeric(5,0) DEFAULT 1,
    warranty_start date,
    warranty_end date,
    buy_price numeric(12,2),
    purchase_date date,
    invoice_no character varying(50) COLLATE pg_catalog."default",
    branch_id integer,
    license_details jsonb,
    
    CONSTRAINT stocks_asset_id_fkey FOREIGN KEY (asset_id)
        REFERENCES ${schemaName}.assets (asset_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_asset_ownership_id_fkey FOREIGN KEY (asset_ownership_status)
        REFERENCES ${schemaName}.asset_ownership_status_types (ownership_status_type_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_branch_id_fkey FOREIGN KEY (branch_id)
        REFERENCES ${schemaName}.branches (branch_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_updated_by_fkey FOREIGN KEY (updated_by)
        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_vender_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES ${schemaName}.vendors (vendor_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT stocks_vendor_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES ${schemaName}.vendors (vendor_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT chk_warranty_dates CHECK (warranty_start <= warranty_end)
)
        `);
    }

}