import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetOwnershipStatusTypesScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createAssetOwnershipStatusTypesTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_ownership_status_types
          (
              ownership_status_type_id SERIAL PRIMARY KEY,
              ownership_status_type_name text COLLATE pg_catalog."default",
              is_active smallint NOT NULL DEFAULT 1,
              is_deleted smallint NOT NULL DEFAULT 0,
              asset_ownership_status_color character varying(10) COLLATE pg_catalog."default",
              ownership_status_description text COLLATE pg_catalog."default",
              created_at timestamp without time zone,
              ownership_status_type ownership_type_enum
              
          )
        `);
    }

    async  insertAssetOwnershipStatusTable(schemaName: string, statuses: { ownership_status_type_name: string }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const statusInsertQuery = `INSERT INTO ${schemaName}.asset_ownership_status_types(ownership_status_type_name)VALUES ($1);`;
        
        await Promise.all(statuses.map(status => {
          return this.dataSource.query(statusInsertQuery, [status.ownership_status_type_name]);
        }));
    }


}