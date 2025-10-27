import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LeaveTypesScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createLeaveTypesTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.leave_types (
                leave_type_id SERIAL PRIMARY KEY,
                name character varying(100) COLLATE pg_catalog."default" NOT NULL,
                short_code character varying(20) COLLATE pg_catalog."default" NOT NULL,
                color_tag character varying(10) COLLATE pg_catalog."default",
                category character varying(20) COLLATE pg_catalog."default",
                created_at timestamp without time zone DEFAULT now(),
                is_deleted boolean DEFAULT false,
                is_active boolean DEFAULT true,
                limited_period boolean DEFAULT false,
                valid_from date,
                expires_on date
                
               
            );
      `);
      await this.dataSource.query(`
        INSERT INTO ${schemaName}.leave_types (name, short_code, color_tag, category)
        VALUES 
          ('Loss of Pay', 'LOP', '#FF0000', 'Unpaid'),
          ('Sick Leave', 'SL', '#00BFFF', 'Paid'),
          ('Casual Leave', 'CL', '#32CD32', 'Paid'),
          ('Floater Leave', 'FL', '#32CD32', 'Paid')
        ON CONFLICT DO NOTHING;
      `);
            console.log(`Table ${schemaName}.leave_types created successfully.`);

        } catch (error) {
            console.error(`Error creating leave_types table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create leave_types table in schema ${schemaName}.`);
        }
    }
}
