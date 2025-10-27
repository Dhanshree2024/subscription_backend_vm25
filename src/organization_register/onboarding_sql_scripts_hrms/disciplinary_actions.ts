import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DisciplinaryActionsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createDisciplinaryActionsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.disciplinary_actions (
            disciplinary_actions_id SERIAL PRIMARY KEY,
            disciplinary_actions_name VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            is_delete BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log(`Table ${schemaName}.disciplinary_actions created successfully.`);

      await this.dataSource.query(`
        INSERT INTO ${schemaName}.disciplinary_actions (disciplinary_actions_name)
        VALUES 
        
        ('Verbal Warning'),
        ('Written Warning'),
        ('Loss of Privileges'),
        ('Performance Improvement Plan'),
        ('Retraining'),
        ('Demotion'),
        ('Temporary Pay Cut'),
        ('Suspension'),
        ('Termination');

      `);

      console.log('disciplinary_actions inserted successfully.');
    } catch (error) {
      console.error(`Error creating disciplinary_actions table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create disciplinary_actions table in schema ${schemaName}.`);
    }
  }
}
