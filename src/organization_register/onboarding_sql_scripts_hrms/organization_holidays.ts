import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class OrganizationHolidaysScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async OrganizationHolidaysTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.organization_holidays (
                holiday_id SERIAL PRIMARY KEY,
                organization_id integer NOT NULL,
                year integer NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
                holiday_year character varying COLLATE pg_catalog."default",
                holidays jsonb NOT NULL,
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                created_by integer,
                created_at timestamp without time zone DEFAULT now(),
                updated_at timestamp without time zone DEFAULT now(),
                branches jsonb,
                CONSTRAINT organization_holidays_created_by_fkey FOREIGN KEY (created_by)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                CONSTRAINT organization_holidays_organization_id_fkey FOREIGN KEY (organization_id)
                    REFERENCES ${schemaName}.organizational_profile (organization_profile_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
               
               
            );
      `);

            console.log(`Table ${schemaName}.organization_holidays created successfully.`);

        } catch (error) {
            console.error(`Error creating organization_holidays table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create organization_holidays table in schema ${schemaName}.`);
        }
    }
}
