import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeStatusScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createEmployeeStatusTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.hiring_status (
          status_id SERIAL PRIMARY KEY,                 -- Unique identifier for the status
          name VARCHAR(50) NOT NULL,                    -- Name of the status (e.g., "Applied", "Onboarding")
          description TEXT,                             -- Additional details about the status
          sequence_number integer,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the status was created
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
          is_active BOOLEAN DEFAULT TRUE,               -- Indicates if the status is active
          is_deleted BOOLEAN DEFAULT FALSE              -- Soft-delete flag
        );
      `);

      console.log(`Table ${schemaName}.hiring_status created successfully.`);

      await this.dataSource.query(`
        INSERT INTO ${schemaName}.hiring_status (name, description,is_active)
        VALUES 
        ('Applied', 'Candidate has applied for the position.',true),
        ('Interview', 'Candidate has interview for the position.',true),
        ('Offered', 'Candidate has been offered.',true),
        ('Onboarding', 'Candidate is being onboarded.',true),
        ('Reject', 'Candidate is rejected.',true);
      `);

      console.log('Initial statuses inserted successfully.');
    } catch (error) {
      console.error(`Error creating hiring_status table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create hiring_status table in schema ${schemaName}.`);
    }
  }
}
