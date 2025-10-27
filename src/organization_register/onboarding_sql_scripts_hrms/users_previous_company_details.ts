import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersPerviousCompanyDetailsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersPerviousCompanyDetailsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_previous_company_details (
               
                previous_company_details_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                user_id INT NOT NULL, -- Foreign key referencing users
                company_name VARCHAR(255) NOT NULL, -- Name of the previous company
                joining_date VARCHAR(7), -- Joining date at the previous company
                leave_date VARCHAR(7), -- Leaving date from the previous company
                role VARCHAR(255), -- Role held at the previous company
                total_experience INTERVAL NULL, -- Total experience in years and months
                work_link VARCHAR(255) NULL,
                recent_graduate BOOLEAN DEFAULT FALSE,
                current_working BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign key constraint
            
             );

        `);
    }
}