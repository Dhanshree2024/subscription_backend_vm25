import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DesignationScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDesignationTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.designations (
                designation_id SERIAL PRIMARY KEY,
                designation_name VARCHAR(150) NOT NULL UNIQUE,
                created_by_id INT, -- Added column for the user who created the record
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign Key Constraint to Users Table
            );

        `);
    }
}