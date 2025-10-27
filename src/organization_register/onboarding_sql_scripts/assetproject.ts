import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class assetProjectScript {
    
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }
    
    
    async createAssetProjectTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_project
            (
                project_id SERIAL PRIMARY KEY,
                project_name text COLLATE pg_catalog."default" NOT NULL,
                contact_person text COLLATE pg_catalog."default",
                project_email text COLLATE pg_catalog."default",
                department_id integer,
                created_by integer,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                is_active smallint DEFAULT 1,
                is_deleted smallint DEFAULT 0,
                project_code text COLLATE pg_catalog."default"
                
            )
    `);
    }

    async insertProjectTable(
        schemaName: string,
        projects: {
            project_name: string;
            contact_person?: string;
            project_email?: string;
            department_id?: number;
            created_by?: number;
            project_code?: string;
        }[]
    ): Promise<void> {
        const projectInsertQuery = `
      INSERT INTO ${schemaName}.asset_project
      (
        project_name,
        contact_person,
        project_email,
        department_id,
        created_by,
        project_code
      )
      VALUES ($1, $2, $3, $4, $5, $6);
    `;

        await Promise.all(
            projects.map(project =>
                this.dataSource.query(projectInsertQuery, [
                    project.project_name,
                    project.contact_person || null,
                    project.project_email || null,
                    project.department_id || null,
                    project.created_by || null,
                    project.project_code || null,
                ])
            )
        );
    }
}