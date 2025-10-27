import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UserCompanyDetailsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUserCompanyDetailsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_company_details (
                users_company_details_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                user_id INT NOT NULL, -- Foreign key referencing users
                employee_id VARCHAR(50) , -- Employee ID
                joining_date DATE  NULL, -- Joining Date
                role_id INT  NULL, -- Role
                department_id INT NULL, -- Department
                designation_id INT NULL, -- Added Designation ID
                shift_id INT , -- Added Shift ID
                shift VARCHAR(100) NULL, -- Shift (optional if shift_id is used)
                salary DECIMAL(15, 2), -- Salary
                is_current BOOLEAN DEFAULT TRUE, -- Indicates if this is the user's current company detail
                start_date DATE, -- Start date of this employment record
                end_date DATE, -- End date of this employment record
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted,
                offered_ctc INT NULL,
                salary_ctc_break_up JSONB NULL,
                reportee_id INT NULL,
                performance_reviewer_id INT NULL,
                leave_authority_id INT NULL,
                notice_period_by_company VARCHAR(200) NULL,
                probation_period_by_company VARCHAR(200) NULL,
                is_mail_send INT DEFAULT 0,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE, -- Foreign key constraint
                CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES ${schemaName}.organization_roles (role_id) ON DELETE CASCADE, -- Foreign key constraint for role
                CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES ${schemaName}.departments (department_id) ON DELETE CASCADE, -- Foreign key constraint for department
                CONSTRAINT fk_designation FOREIGN KEY (designation_id) REFERENCES ${schemaName}.designations (designation_id) ON DELETE CASCADE -- Foreign key constraint for designation
                -- CONSTRAINT fk_shift FOREIGN KEY (shift_id) REFERENCES ${schemaName}.shifts (shift_id) ON DELETE CASCADE -- Foreign key constraint for shift
            );
        `);
        
    }
}