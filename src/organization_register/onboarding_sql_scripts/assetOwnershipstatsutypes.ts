import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetOwnershipStatusTypesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createAssetOwnershipStatusTypesTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_ownership_status_types
      (
          ownership_status_type_id SERIAL PRIMARY KEY,
          ownership_status_type_name text COLLATE pg_catalog."default",
          ownership_status_description text COLLATE pg_catalog."default",
          ownership_status_type ownership_type_enum,
          asset_ownership_status_color character varying(10) COLLATE pg_catalog."default",
          is_active smallint NOT NULL DEFAULT 1,
          is_deleted smallint NOT NULL DEFAULT 0,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async insertAssetOwnershipStatusTable(
    schemaName: string,
    statuses: {
      ownership_status_type_name: string;
      ownership_status_description: string;
      ownership_status_type: string;
      asset_ownership_status_color: string;
    }[],
  ): Promise<void> {
    const statusInsertQuery = `
      INSERT INTO ${schemaName}.asset_ownership_status_types
        (ownership_status_type_name, ownership_status_description, ownership_status_type, asset_ownership_status_color)
      VALUES ($1, $2, $3, $4);
    `;

    await Promise.all(
      statuses.map((status) =>
        this.dataSource.query(statusInsertQuery, [
          status.ownership_status_type_name.trim(),
          status.ownership_status_description.trim(),
          status.ownership_status_type.trim(),
          status.asset_ownership_status_color.trim(),
        ]),
      ),
    );
  }
}
