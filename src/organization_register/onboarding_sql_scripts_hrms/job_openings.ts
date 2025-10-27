import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class JobOpeningsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createJobOpeningsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.job_openings (
            job_opening_id SERIAL PRIMARY KEY,
            job_id character varying(255) COLLATE pg_catalog."default" NOT NULL,
            job_title character varying(255) COLLATE pg_catalog."default" NOT NULL,
            designation_id integer NOT NULL,
            department_id integer NOT NULL,
            branch_id integer NOT NULL,
            employment_type_id integer NOT NULL,
            job_created_by_id integer,
            work_experience character varying(255) COLLATE pg_catalog."default" NOT NULL,
            offered_salary character varying(255) COLLATE pg_catalog."default" NOT NULL,
            job_description text COLLATE pg_catalog."default",
            opening_status character varying(20) COLLATE pg_catalog."default",
            published_at timestamp with time zone,
            expires_at timestamp with time zone,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
            notify_employees boolean DEFAULT false,
            CONSTRAINT fk_branch FOREIGN KEY (branch_id)
                REFERENCES ${schemaName}.branches (branch_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT fk_created_by FOREIGN KEY (job_created_by_id)
                REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT fk_department FOREIGN KEY (department_id)
                REFERENCES ${schemaName}.departments (department_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT fk_designation FOREIGN KEY (designation_id)
                REFERENCES ${schemaName}.designations (designation_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT fk_employment_type FOREIGN KEY (employment_type_id)
                REFERENCES public.employment_types (employment_type_id) MATCH SIMPLE
                ON UPDATE NO ACTION
                ON DELETE NO ACTION,
            CONSTRAINT job_openings_opening_status_check CHECK (opening_status::text = ANY (ARRAY['Open'::character varying, 'Closed'::character varying, 'Cancelled'::character varying, 'Draft'::character varying]::text[]))

            
        );
      `);

      console.log(`Table ${schemaName}.job_openings created successfully.`);

    } catch (error) {
      console.error(`Error creating job_openings table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create job_openings table in schema ${schemaName}.`);
    }
  }
}
