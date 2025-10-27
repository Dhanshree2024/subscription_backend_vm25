import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersAssetScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersAssetTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_assets (
                asset_id SERIAL PRIMARY KEY,                        -- Auto-incrementing primary key for each asset
                user_id INT NOT NULL,         -- Unique identifier for the asset (non-primary key)
                asset_name VARCHAR(255) NOT NULL,             -- Name of the asset
                asset_type VARCHAR(255) NULL,
                assigned_by INT NOT NULL,                     -- User ID of the person who assigned the asset
                assigned_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Date and time when the asset was assigned
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Last updated timestamp
                is_active BOOLEAN DEFAULT TRUE,               -- Indicates if the asset is active (true) or inactive (false)
                is_deleted BOOLEAN DEFAULT FALSE,             -- Indicates if the asset is deleted (true) or not (false)
                CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE, -- Assuming there's a 'users' table where 'user_id' exists
                CONSTRAINT fk_auser_id FOREIGN KEY (user_id) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE -- Assuming there's a 'users' table where 'user_id' exists

            );

        `);
    }
}