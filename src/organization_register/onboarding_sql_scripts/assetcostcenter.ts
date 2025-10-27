import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class assetCostCenterScript {
    
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }
    
    
    async createAssetCostCenterScriptTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_cost_centers
      (
          cost_center_id SERIAL PRIMARY KEY,
          cost_center_code text COLLATE pg_catalog."default" NOT NULL,
          cost_center_contact_person text COLLATE pg_catalog."default",
          cost_center_email text COLLATE pg_catalog."default",
          department_id integer,
          created_by integer,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          is_active smallint DEFAULT 1,
          is_deleted smallint DEFAULT 0,
          cost_center_budget integer DEFAULT 0,
          cost_center_spent integer DEFAULT 0,
          cost_center_utilization integer,
          cost_center_name text COLLATE pg_catalog."default",
          cost_center_manger_name_id integer,
         
          CONSTRAINT fk_department FOREIGN KEY (department_id)
              REFERENCES ${schemaName}.departments (department_id) MATCH SIMPLE
              ON UPDATE NO ACTION
              ON DELETE SET NULL
      );
    `);
    }

    async insertCostCenterTable(
        schemaName: string,
        costCenters: {
            cost_center_code: string;
            cost_center_contact_person?: string;
            cost_center_email?: string;
            department_id?: number;
            created_by?: number;
            cost_center_name?: string;
            cost_center_budget?: number;
            cost_center_spent?: number;
            cost_center_utilization?: number;
            cost_center_manger_name_id?: number;
        }[]
    ): Promise<void> {
        const costCenterInsertQuery = `
      INSERT INTO ${schemaName}.asset_cost_centers
      (
        cost_center_code,
        cost_center_contact_person,
        cost_center_email,
        department_id,
        created_by,
        cost_center_name,
        cost_center_budget,
        cost_center_spent,
        cost_center_utilization,
        cost_center_manger_name_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `;

        await Promise.all(
            costCenters.map(center =>
                this.dataSource.query(costCenterInsertQuery, [
                    center.cost_center_code,
                    center.cost_center_contact_person || null,
                    center.cost_center_email || null,
                    center.department_id || null,
                    center.created_by || null,
                    center.cost_center_name || null,
                    center.cost_center_budget ?? 0,
                    center.cost_center_spent ?? 0,
                    center.cost_center_utilization || null,
                    center.cost_center_manger_name_id || null,
                ])
            )
        );
    }
}