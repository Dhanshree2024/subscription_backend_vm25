import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetStatusTypesScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createAssetStatusTable(schemaName: string): Promise<void> {
       
      await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_status_types
          (
              status_type_id SERIAL PRIMARY KEY,
              status_type_name text COLLATE pg_catalog."default",
              is_active smallint NOT NULL DEFAULT 1,
              is_deleted smallint NOT NULL DEFAULT 0,
              status_color_code character varying(10) COLLATE pg_catalog."default",
              asset_status_description text COLLATE pg_catalog."default",
              created_at timestamp without time zone
              
          )

      `);
    }

    async  insertAssetStatusTable(schemaName: string, statuses: { status_type_name: string }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const statusInsertQuery = `INSERT INTO ${schemaName}.asset_status_types(status_type_name)VALUES ($1);`;
        
        await Promise.all(statuses.map(status => {
          return this.dataSource.query(statusInsertQuery, [status.status_type_name]);
        }));
    }


}