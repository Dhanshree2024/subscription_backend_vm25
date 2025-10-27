import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ActivityLogScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createActivityLogTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.activity_log (
            id SERIAL PRIMARY KEY,                     -- Unique identifier for the log entry
            action_type VARCHAR(50) NOT NULL,          -- Type of action (e.g., 'insert', 'update', 'delete')
            affected_table VARCHAR(50) NOT NULL,       -- The table affected (e.g., 'Employee', 'Education', etc.)
            affected_record_id INT NOT NULL,           -- ID of the affected record (e.g., user_id, education_id)
            previous_data JSONB,                       -- JSON data to store both previous 
            data_modified JSONB,    					-- JSON data to current values
            user_id INT NOT NULL,                      -- ID of the user who performed the action
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when the log entry is created
        );
      `);

      console.log(`Table ${schemaName}.activity_log created successfully.`);

    } catch (error) {
      console.error(`Error creating activity_log table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create activity_log table in schema ${schemaName}.`);
    }
  }
}
