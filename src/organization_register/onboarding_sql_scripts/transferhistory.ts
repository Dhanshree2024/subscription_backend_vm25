import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetTransferHistoryScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




    async createAssetTransferHistoryTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_transfer_history
(
    id SERIAL PRIMARY KEY,
    asset_id integer NOT NULL,
    previous_organization_id integer,
    previous_used_by integer,
    previous_managed_by integer,
    new_organization_id integer,
    used_by integer,
    managed_by integer,
    transfered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    system_code text COLLATE pg_catalog."default",
    CONSTRAINT asset_transfer_history_asset_id_fkey FOREIGN KEY (asset_id)
        REFERENCES ${schemaName}.assets (asset_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
        `);
    }

}