import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MisconductReasonsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createMisconductReasonsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.misconduct_reasons (
            misconduct_reasons_id SERIAL PRIMARY KEY,
            misconduct_reasons_name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_delete BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log(`Table ${schemaName}.misconduct_reasons created successfully.`);

      await this.dataSource.query(`
        INSERT INTO ${schemaName}.misconduct_reasons (misconduct_reasons_name, description)
        VALUES 
        ('Employee Misconduct', 'Any fraudulent activities'),
        ('Harassment', 'Physical violence or attack against another person'),
        ('Discrimination', 'Serious insubordination'),
        ('Absenteeism', 'Lack of care for duties (gross negligence)'),
        ('Poor Work Performance', 'Misuse of confidential information'),
        ('Workplace Bullying', 'Offering or accepting bribes'),
        ('Tardiness', 'Damage to company property');
      `);

      console.log('misconduct reasons inserted successfully.');
    } catch (error) {
      console.error(`Error creating misconduct reasons table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create misconduct reasons table in schema ${schemaName}.`);
    }
  }
}
