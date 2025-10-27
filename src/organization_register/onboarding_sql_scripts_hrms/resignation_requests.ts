import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ResignationRequestScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    /**
     * Creates the `employee_status` table in the specified schema and populates initial statuses.
     * @param schemaName - The schema where the table should be created.
     */
    async createResignationRequestTable(schemaName: string): Promise<void> {
        try {
            await this.dataSource.query(`
                CREATE TABLE IF NOT EXISTS ${schemaName}.resignation_requests (
 
            resignation_id SERIAL PRIMARY KEY,
            user_id integer NOT NULL,
            resignation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            reason_category text COLLATE pg_catalog."default",
            descriptive_reason text COLLATE pg_catalog."default",
            to_email_by_employee text[] COLLATE pg_catalog."default",
            cc_email_by_employee text[] COLLATE pg_catalog."default",
            email_subject_by_employee character varying(255) COLLATE pg_catalog."default",
            email_content_by_employee text COLLATE pg_catalog."default",
            status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Pending'::character varying,
            approved_by integer,
            approval_date timestamp without time zone,
            notice_period integer,
            last_working_day date,
            email_subject_by_hr character varying(255) COLLATE pg_catalog."default",
            email_content_by_hr text COLLATE pg_catalog."default",
            handover_deadline date,
            kt_assigned_to text[] COLLATE pg_catalog."default",
            hr_comments text COLLATE pg_catalog."default",
            created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
            is_active boolean DEFAULT true,
            is_deleted boolean DEFAULT false,
            rejected_by integer,
            rejection_date timestamp without time zone,
            rejection_reason text COLLATE pg_catalog."default",
            clearance_departments text[] COLLATE pg_catalog."default",
            is_kt_required boolean DEFAULT false,
            additional_comments text COLLATE pg_catalog."default",
            exit_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
            termination_reason_id integer,
 
            -- Foreign Key Constraints
            CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
            CONSTRAINT fk_approved_by FOREIGN KEY (approved_by) REFERENCES ${schemaName}.users(user_id) ON DELETE SET NULL,
            CONSTRAINT fk_resignation_rejected_by FOREIGN KEY (rejected_by) REFERENCES ${schemaName}.users(user_id) ON DELETE SET NULL
        );
      `);

            console.log(`Table ${schemaName}.resignation_requests created successfully.`);

        } catch (error) {
            console.error(`Error creating resignation_requests table in schema ${schemaName}:`, error);
            throw new Error(`Failed to create resignation_requests table in schema ${schemaName}.`);
        }
    }
}