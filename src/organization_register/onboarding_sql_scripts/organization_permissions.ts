import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class OrganizationPermissionScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createOrganizationPermissionTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.organization_permissions
                (
                    permission_id SERIAL PRIMARY KEY,
                    role_id integer NOT NULL,
                    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                    is_active boolean DEFAULT true,
                    is_deleted boolean DEFAULT false,
                    permissions jsonb,
                    
                    CONSTRAINT fk_role FOREIGN KEY (role_id)
                        REFERENCES ${schemaName}.organization_roles (role_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION
                )
        `);
    }

    async  insertOrganizationRolesPermissionTable(schemaName: string, roles: { role_id: number,permission:any[] }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const roleInsertQuery = `INSERT INTO ${schemaName}.organization_roles(role_name)VALUES ($1);`;
        
         await Promise.all(roles.map(role => {
            return this.dataSource.query(
                `INSERT INTO ${schemaName}.organization_permissions (role_id, permissions) VALUES ($1, $2::jsonb)`,
                [role.role_id, JSON.stringify(role.permission)]
            );
          }));
        
    }
         
    
    
}