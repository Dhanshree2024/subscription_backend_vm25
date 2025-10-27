import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeFloaterLeaveScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_floater_holidays` table in the specified schema.
   * @param schemaName - The schema where the table should be created.
   */
  async createEmployeeFloaterLeaveTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.employee_floater_holidays (
          floater_holiday_id SERIAL PRIMARY KEY,
          
          employee_id INTEGER NOT NULL,
          organization_id INTEGER NOT NULL,
          
          year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
          holidays JSONB NOT NULL,
          branches JSON,
          holiday_year VARCHAR,
          
          is_active BOOLEAN DEFAULT TRUE,
          is_deleted BOOLEAN DEFAULT FALSE,
          
          created_by INTEGER,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_employee_user FOREIGN KEY (employee_id)
            REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE CASCADE,

          CONSTRAINT fk_organization_profile FOREIGN KEY (organization_id)
            REFERENCES ${schemaName}.organizational_profile (organization_profile_id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE CASCADE
        );
      `);

      console.log(`Table ${schemaName}.employee_floater_holidays created successfully.`);
    } catch (error) {
      console.error(`Error creating employee_floater_holidays table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create employee_floater_holidays table in schema ${schemaName}.`);
    }
  }
}
