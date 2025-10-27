import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DepartmentsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDepartmentsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.departments (
                department_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                department_name VARCHAR(255) NOT NULL, -- Department name
                department_head_id INT, -- Added column for department head (can reference users table)
                created_by_id INT, -- Added column for the user who created the record
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE, -- Foreign Key Constraint to Users Table
                CONSTRAINT fk_department_head FOREIGN KEY (department_head_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign Key Constraint to Users Table
            );

        `);
    }
}