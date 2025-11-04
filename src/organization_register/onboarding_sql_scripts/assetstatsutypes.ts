import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetStatusTypesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createAssetStatusTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_status_types
      (
          status_type_id SERIAL PRIMARY KEY,
          status_type_name text COLLATE pg_catalog."default",
          asset_status_description text COLLATE pg_catalog."default",
          status_color_code character varying(10) COLLATE pg_catalog."default",
          is_active smallint NOT NULL DEFAULT 1,
          is_deleted smallint NOT NULL DEFAULT 0,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async insertAssetStatusTable(
    schemaName: string,
    statuses: {
      status_type_name: string;
      asset_status_description: string;
      status_color_code: string;
    }[],
  ): Promise<void> {
    const statusInsertQuery = `
      INSERT INTO ${schemaName}.asset_status_types
        (status_type_name, asset_status_description, status_color_code)
      VALUES ($1, $2, $3);
    `;

    await Promise.all(
      statuses.map((status) =>
        this.dataSource.query(statusInsertQuery, [
          status.status_type_name.trim(),
          status.asset_status_description.trim(),
          status.status_color_code.trim(),
        ]),
      ),
    );
  }
}
