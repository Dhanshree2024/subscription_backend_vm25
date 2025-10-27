import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class OrganizationSetupScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `organization_setup` table in the specified schema and inserts default row.
   * @param schemaName - The schema where the table should be created.
   * @param organizationId - The ID of the organization to insert.
   */
  async createOrganizationSetupTable(schemaName: string, organizationId: number): Promise<void> {
    try {
      // Step 1: Create the table
      await this.dataSource.query(`
        CREATE TABLE ${schemaName}.organization_setup (
          organization_setup_id SERIAL PRIMARY KEY,
          organization_id INT NOT NULL,
          pf_settings JSONB DEFAULT '{}'::JSONB,
          lwf_settings JSONB DEFAULT '{}'::JSONB,
          esic_settings JSONB DEFAULT '{}'::JSONB,
          insurance_settings JSONB DEFAULT '{}'::JSONB,
          employee_id_format JSONB DEFAULT '{}'::JSONB,
          attendance_setting JSONB DEFAULT '{}'::JSONB,
          sync_attendance BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Step 2: Insert default row with given organizationId
      await this.dataSource.query(
        `INSERT INTO ${schemaName}.organization_setup (organization_id) VALUES ($1)`,
        [organizationId]
      );

      console.log(`Table ${schemaName}.organization_setup created and default record inserted.`);
    } catch (error) {
      console.error(`Error creating or inserting into organization_setup table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create or insert into organization_setup table in schema ${schemaName}.`);
    }
  }
}
