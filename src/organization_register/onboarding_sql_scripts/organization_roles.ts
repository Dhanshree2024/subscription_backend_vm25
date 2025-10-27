import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class OrganizationRolesScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createOrganizationRolesTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.organization_roles
            (
                role_id SERIAL PRIMARY KEY,
                role_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
                created_by integer,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                is_compulsary boolean DEFAULT false,
                is_outside_organization boolean DEFAULT false,
                role_description text COLLATE pg_catalog."default",
                role_type public.role_type_enum
                
            )

        `);
    }

    async  insertOrganizationRolesTable(schemaName: string, roles: { role_name: string }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const roleInsertQuery = `INSERT INTO ${schemaName}.organization_roles(role_name)VALUES ($1);`;
        
        await Promise.all(roles.map(role => {
          return this.dataSource.query(roleInsertQuery, [role.role_name]);
        }));
    }
}