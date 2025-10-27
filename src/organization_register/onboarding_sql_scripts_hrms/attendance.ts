import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AttendanceScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createAttendanceTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.attendance (

                id SERIAL PRIMARY KEY,
                user_id integer NOT NULL,
                date date NOT NULL DEFAULT CURRENT_DATE,
                clock_in timestamp with time zone,
                clock_out timestamp with time zone,
                work_hours character varying(50) COLLATE pg_catalog."default",
                shift_name character varying(50) COLLATE pg_catalog."default",
                shift_start_time time without time zone,
                shift_end_time time without time zone,
                overtime interval,
                late_arrival interval,
                early_departure interval,
                attendance_status character varying(20) COLLATE pg_catalog."default",
                reason text COLLATE pg_catalog."default",
                check_in_location character varying(255) COLLATE pg_catalog."default",
                check_in_device character varying(50) COLLATE pg_catalog."default",
                supporting_document text COLLATE pg_catalog."default",
                latitude DECIMAL(10, 7),
                longitude DECIMAL(10, 7),
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                FOREIGN KEY (user_id) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE          

        );
      `);

            console.log(`Table ${schemaName}.resignation_requests created successfully.`);

        } catch (error) {
            console.error(`Error creating resignation_requests table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create resignation_requests table in schema ${schemaName}.`);
        }
    }
}
