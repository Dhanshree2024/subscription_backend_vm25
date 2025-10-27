import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeDisciplinaryRecordsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createEmployeeDisciplinaryRecordsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.employee_disciplinary_records (
            employee_disciplinary_records_id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL,
            misconduct_reasons_id INT NOT NULL,
            disciplinary_actions_id INT NOT NULL,
            disciplinary_action_status_id INT NOT NULL,
            incident_date DATE NOT NULL,
            resolution_date DATE NULL,
            description TEXT NOT NULL,
            comments TEXT NULL,
            initiated_by INT NOT NULL,  -- New Column for tracking who initiated the action
            is_active BOOLEAN DEFAULT TRUE,
            is_delete BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
            FOREIGN KEY (initiated_by) REFERENCES ${schemaName}.users(user_id),
            FOREIGN KEY (misconduct_reasons_id) REFERENCES ${schemaName}.misconduct_reasons(misconduct_reasons_id),
            FOREIGN KEY (disciplinary_actions_id) REFERENCES ${schemaName}.disciplinary_actions(disciplinary_actions_id),
            FOREIGN KEY (disciplinary_action_status_id) REFERENCES ${schemaName}.disciplinary_action_statuses(disciplinary_action_status_id)
        );
      `);

      console.log(`Table ${schemaName}.employee_disciplinary_records created successfully.`);

    } catch (error) {
      console.error(`Error creating employee_disciplinary_records table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create employee_disciplinary_records table in schema ${schemaName}.`);
    }
  }
}
