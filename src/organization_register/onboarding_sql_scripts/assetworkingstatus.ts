import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetWorkingStatusScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




    async createAssetWorkingStatusTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
        CREATE TABLE IF NOT EXISTS ${schemaName}.asset_working_status_types
          (
              working_status_type_id SERIAL PRIMARY KEY,
              working_status_type_name text COLLATE pg_catalog."default",
              is_active smallint NOT NULL DEFAULT 1,
              is_deleted smallint NOT NULL DEFAULT 0,
              working_status_color character varying(20) COLLATE pg_catalog."default",
              working_status_description text COLLATE pg_catalog."default",
              created_at timestamp without time zone
              
          )
        `);
    }


    async  insertAssetWorkingStatusTable(schemaName: string, statuses: { working_status_type_name: string }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const statusInsertQuery = `INSERT INTO ${schemaName}.asset_working_status_types(working_status_type_name)VALUES ($1);`;
        
        await Promise.all(statuses.map(status => {
          return this.dataSource.query(statusInsertQuery, [status.working_status_type_name]);
        }));
    }

}