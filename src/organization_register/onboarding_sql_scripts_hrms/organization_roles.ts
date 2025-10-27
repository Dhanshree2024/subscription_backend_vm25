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
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.organization_roles (
                role_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                role_name VARCHAR(255) NOT NULL, -- Role name (Admin, HR Manager, Employee, etc.)
                created_by INT, -- User who created the role
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the document type is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the document type is deleted
                is_compulsary BOOLEAN DEFAULT FALSE, -- Indicates if the OTP page is required
                is_outside_organization BOOLEAN DEFAULT FALSE, -- Indicates if the OTP page is required
                role_description VARCHAR(255),
                CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES ${schemaName}.users (user_id) -- Foreign key to users table
            );

        `);

        await this.dataSource.query(`
            INSERT INTO ${schemaName}.organization_roles (role_name)
            VALUES 
             ('Admin'),
             ('Employee');
         `);
    }
}