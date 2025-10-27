import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InterviewsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createInterviewsTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
        
            CREATE TABLE IF NOT EXISTS ${schemaName}.interviews (
                interview_id SERIAL PRIMARY KEY,
                user_id integer NOT NULL,
                interviewdate date NOT NULL,
                interviewers integer NOT NULL,
                interviewtype character varying COLLATE pg_catalog."default" NOT NULL,
                remarks text COLLATE pg_catalog."default",
                interviewstatus character varying COLLATE pg_catalog."default" NOT NULL,
                rescheduledate date,
                reschedulereason text COLLATE pg_catalog."default",
                is_active boolean DEFAULT true,
                is_deleted boolean DEFAULT false,
                created_at timestamp without time zone DEFAULT now(),
                updated_at timestamp without time zone DEFAULT now(),
                interviewcompleted boolean DEFAULT false,
                CONSTRAINT interviews_interviewers_fkey FOREIGN KEY (interviewers)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE,
                CONSTRAINT interviews_user_id_fkey FOREIGN KEY (user_id)
                    REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            
            );
      `);

            console.log(`Table ${schemaName}.interviews created successfully.`);

        } catch (error) {
            console.error(`Error creating interviews table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create interviews table in schema ${schemaName}.`);
        }
    }
}
