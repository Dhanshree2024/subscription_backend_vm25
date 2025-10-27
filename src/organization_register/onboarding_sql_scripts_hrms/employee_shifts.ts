import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeShiftsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createEmployeeShiftsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.employee_shifts (
            employee_shift_id SERIAL PRIMARY KEY,
            employee_id integer NOT NULL,
            shift_rulesets_id integer,
            effective_from date,
            effective_to date,
            assigned_by integer,
            created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT employee_shifts_shift_rulesets_id_fkey FOREIGN KEY (shift_rulesets_id)
                REFERENCES ${schemaName}.shift_rulesets (shift_rulesets_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE CASCADE    
           
        );
      `);

      console.log(`Table ${schemaName}.employee_shifts created successfully.`);

    } catch (error) {
      console.error(`Error creating employee_shifts table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create employee_shifts table in schema ${schemaName}.`);
    }
  }
}
