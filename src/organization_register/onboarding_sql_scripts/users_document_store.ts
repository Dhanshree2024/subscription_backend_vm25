import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersDocumentStoreScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersDocumentStoreTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_document_store (
                user_document_store_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                user_id INT NOT NULL, -- Foreign key referencing org_tcs.users
                document_type_id INT NOT NULL, -- Foreign key referencing org_tcs.document_type
                document_uploaded_by INT NOT NULL, -- User ID or reference to the user who added the document
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE, -- Foreign key constraint to users table
                CONSTRAINT fk_document_type FOREIGN KEY (document_type_id) REFERENCES ${schemaName}.document_type (document_type_id) ON DELETE CASCADE, -- Foreign key constraint to document_type table
                CONSTRAINT fk_document_uploaded_by FOREIGN KEY (document_uploaded_by) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign key constraint to users table for the user who added the document
            );
        `);
    }
}