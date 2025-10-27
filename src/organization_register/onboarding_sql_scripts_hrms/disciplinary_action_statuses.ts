import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DisciplinaryActionStatusesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createDisciplinaryActionStatusesTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.disciplinary_action_statuses (
            disciplinary_action_status_id SERIAL PRIMARY KEY,
            disciplinary_action_status_name VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            is_delete BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log(`Table ${schemaName}.disciplinary_action_statuses created successfully.`);

      await this.dataSource.query(`
        INSERT INTO ${schemaName}.disciplinary_action_statuses (disciplinary_action_status_name)
        VALUES 
        
        ('Draft'),
        ('Initiated'),
        ('Under Investigation'),
        ('Decision Pending'),
        ('Action Taken'),
        ('Appeal in Progress'),
        ('Resolved');

      `);

      console.log('disciplinary_action_statuses inserted successfully.');
    } catch (error) {
      console.error(`Error creating disciplinary_action_statuses table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create disciplinary_action_statuses table in schema ${schemaName}.`);
    }
  }
}
