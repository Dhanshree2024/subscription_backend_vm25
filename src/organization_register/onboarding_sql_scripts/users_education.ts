import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersEducationScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersEducationTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_education (
                education_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                user_id INT NOT NULL, -- Foreign key referencing org_spsp.users
                university_name VARCHAR(255) NOT NULL, -- Degree Name
                degree_type VARCHAR(255) NOT NULL CHECK (degree_type IN (
                    'Secondary Schooling',
                    'Higher Secondary',
                    'Diploma',
                    'Undergraduate / Bachelor Degree',
                    'Postgraduate / Master Degree',
                    'Doctoral Degree (PhD)'
                )), -- Degree Type column with inline enum-like check constraint
                institute_name VARCHAR(255) NOT NULL, -- Institute Name
                field_of_study VARCHAR(255), -- Field of Study
                start_date DATE, -- Start Date
                end_date DATE, -- End Date
                percentage_or_cgpa VARCHAR(10), -- Percentage or CGPA
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign key constraint
            );

        `);
    }
}