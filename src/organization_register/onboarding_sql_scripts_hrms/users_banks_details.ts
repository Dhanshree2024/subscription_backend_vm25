import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersBankDetailsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersBankDetailsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_bank_details (
                bank_details_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                user_id INT NOT NULL, -- Foreign key referencing users
                account_holder_name VARCHAR(255) NULL, -- Name of the account holder
                account_number VARCHAR(50) NULL, -- Account number
                bank_name VARCHAR(255) NULL, -- Bank name
                ifsc_code VARCHAR(20) NULL, -- IFSC code
                branch_name VARCHAR(255), -- Branch name of the bank
                branch_code VARCHAR(255), -- Branch name of the bank
                branch_address VARCHAR(255), -- Branch name of the bank
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted
                is_primary BOOLEAN DEFAULT FALSE,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign key constraint
            );

        `);
    }
}