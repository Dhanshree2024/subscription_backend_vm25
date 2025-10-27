import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ManualAttendanceScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createManualAttendanceTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.manual_attendance_requests (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                clock_in TIMESTAMP WITH TIME ZONE,
                clock_out TIMESTAMP WITH TIME ZONE,
                work_hours VARCHAR(255),
                reason TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                requested_to INTEGER NOT NULL,
                requested_by INTEGER NOT NULL,
                attendance_record_id INTEGER,
                remarks text,
                cancellation_reason text,
                is_active BOOLEAN DEFAULT TRUE,
                is_deleted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requested_to) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (requested_by) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (attendance_record_id) REFERENCES ${schemaName}.attendance(id) ON DELETE CASCADE
            );
      `);

            console.log(`Table ${schemaName}.resignation_requests created successfully.`);

        } catch (error) {
            console.error(`Error creating resignation_requests table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create resignation_requests table in schema ${schemaName}.`);
        }
    }
}
