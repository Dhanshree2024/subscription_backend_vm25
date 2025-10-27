import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class assetLocationScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }




    async createAssetLocationScriptTable(schemaName: string): Promise<void> {

        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.asset_locations
            (
                location_id SERIAL PRIMARY KEY,
                branch_id integer,
                department_id numeric,
                location_floor_room text COLLATE pg_catalog."default",
                location_code text COLLATE pg_catalog."default",
                location_city text COLLATE pg_catalog."default",
                location_state text COLLATE pg_catalog."default",
                location_total_asset numeric DEFAULT 0,
                location_street_address text COLLATE pg_catalog."default",
                location_description text COLLATE pg_catalog."default",
                location_google_map_pin text COLLATE pg_catalog."default",
                created_at timestamp without time zone DEFAULT now(),
                updated_at timestamp without time zone DEFAULT now(),
                created_by numeric,
                updated_by numeric,
                location_name text COLLATE pg_catalog."default",
                is_active integer DEFAULT 1,
                is_deleted integer DEFAULT 0
                
            )

        `);
    }

    async insertAssetLocations(
        schemaName: string,
        locations: {
            branch_id?: number;
            department_id?: number;
            location_name: string;
            location_floor_room?: string;
            location_code?: string;
            location_city?: string;
            location_state?: string;
            location_street_address?: string;
            location_description?: string;
            location_google_map_pin?: string;
            location_total_asset?: number;
            created_by?: number;
        }[]
    ): Promise<void> {
        const insertQuery = `
    INSERT INTO ${schemaName}.asset_locations
      (branch_id, department_id, location_name, location_floor_room, location_code,
       location_city, location_state, location_street_address, location_description,
       location_google_map_pin, location_total_asset, created_by)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  `;

        for (const loc of locations) {
            await this.dataSource.query(insertQuery, [
                loc.branch_id || null,
                loc.department_id || null,
                loc.location_name,
                loc.location_floor_room || null,
                loc.location_code || null,
                loc.location_city || null,
                loc.location_state || null,
                loc.location_street_address || null,
                loc.location_description || null,
                loc.location_google_map_pin || null,
                loc.location_total_asset || 0,
                loc.created_by || null,
            ]);
        }
    }

}