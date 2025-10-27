import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class UsersBenefitsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUsersBenefitsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.users_benefits (
                users_benefits_id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,             -- References the employee
                addhar_card_no BIGINT,
                is_covered_under_pf BOOLEAN ,
                uan_number VARCHAR(50),
                pf_member_id VARCHAR(50),
                pf_join_date DATE,
                family_pf_no VARCHAR(50),
                is_covered_under_esic BOOLEAN ,
                insurance_number VARCHAR(50),
                is_covered_under_lwf BOOLEAN ,
                lwf_number VARCHAR(50),
                policy_type VARCHAR(255)  NULL,
                policy_no VARCHAR(50)  NULL,
                policy_coverage VARCHAR(255),
                policy_period VARCHAR(255),
                sum_insured DECIMAL(18, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                is_delete BOOLEAN DEFAULT FALSE,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES ${schemaName}.users (user_id) ON DELETE CASCADE -- Foreign key constraint

            );

        `);
    }
}