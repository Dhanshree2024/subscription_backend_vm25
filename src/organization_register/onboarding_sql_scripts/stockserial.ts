import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetStockSerialsScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

    async createAssetStockSerialsTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_stock_serials
(
    asset_stocks_unique_id SERIAL PRIMARY KEY,
    asset_id integer NOT NULL,
    stock_id integer NOT NULL,
    stock_serials text COLLATE pg_catalog."default",
    asset_item_id integer,
    stock_asset_relation_id jsonb,
    license_key text COLLATE pg_catalog."default",
    system_code text COLLATE pg_catalog."default",
    license_detail jsonb,
    CONSTRAINT asset_stock_serials_asset_item_id_fkey FOREIGN KEY (asset_item_id)
        REFERENCES ${schemaName}.asset_items (asset_item_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT asset_stock_serials_stock_id_fkey FOREIGN KEY (stock_id)
        REFERENCES ${schemaName}.stocks (stock_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID,
    CONSTRAINT asset_stocks_unique_asset_id_fkey FOREIGN KEY (asset_id)
        REFERENCES ${schemaName}.assets (asset_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
        `);
    }

}