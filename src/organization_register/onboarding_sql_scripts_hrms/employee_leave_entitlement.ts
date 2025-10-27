import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmployeeLeaveEntitlementScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createEmployeeLeaveEntitlementTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.employee_leave_entitlement (
            
            entitlement_id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL,
            leave_type_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            entitled_days NUMERIC(5,2) DEFAULT 0,
            used_days NUMERIC(5,2) DEFAULT 0,
            carried_forward_days NUMERIC(5,2) DEFAULT 0,
            encashed_days NUMERIC(5,2) DEFAULT 0,
            lapsed_days NUMERIC(5,2) DEFAULT 0,
            adjusted_days NUMERIC(5,2) DEFAULT 0,
            balance_days NUMERIC(5,2) GENERATED ALWAYS AS 
                ((entitled_days + carried_forward_days - used_days - encashed_days - lapsed_days + adjusted_days)) STORED,
            credit_type character varying(20) COLLATE pg_catalog."default" CHECK (credit_type::text = ANY (ARRAY['auto', 'manual']::text[])),
            is_locked BOOLEAN DEFAULT false,
            created_by INTEGER,
            created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_employee FOREIGN KEY (employee_id)
                REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE CASCADE,
            CONSTRAINT fk_leave_type FOREIGN KEY (leave_type_id)
                REFERENCES ${schemaName}.leave_types (leave_type_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE CASCADE
        );
      `);

      console.log(`Table ${schemaName}.employee_leave_entitlement created successfully.`);

    } catch (error) {
      console.error(`Error creating employee_leave_entitlement table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create employee_leave_entitlement table in schema ${schemaName}.`);
    }
  }
}
