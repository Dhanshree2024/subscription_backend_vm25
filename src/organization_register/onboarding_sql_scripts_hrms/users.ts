import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';


@Injectable()
export class UserScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async createUserTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.users (
            user_id SERIAL PRIMARY KEY,
            first_name VARCHAR(255),
            middle_name VARCHAR(255), -- Added middle name
            last_name VARCHAR(255),
            date_of_birth DATE, -- Added date of birth
            gender VARCHAR(100), -- Added gender (e.g., 'Male', 'Female', 'Other')
            blood_group VARCHAR(5), -- Added blood group (e.g., 'A+', 'O-')
            business_email VARCHAR(255) NULL,
            personal_mail VARCHAR(255) NULL,
            official_email VARCHAR(255) NULL,
            phone_number VARCHAR(10),
            marital_status VARCHAR(50),
            street TEXT, -- Added address (line 1)
            landmark TEXT, -- Added address (line 2)
            city VARCHAR(100), -- Added city
            state VARCHAR(100), -- Added state
            zip VARCHAR(20), -- Added zip/postal code
            country VARCHAR(100), -- Added country
            password VARCHAR(255),
            current_ctc DECIMAL(10,2) NULL,
            expected_ctc DECIMAL(10,2) NULL,
            notice_period INT NULL,
            linkedin_link VARCHAR(255) NULL,
            github_link VARCHAR(255) NULL,
            facebook_link VARCHAR(255) NULL,
            aadhar_card VARCHAR(20) NULL,
            pan_card VARCHAR(20) NULL,
            driving_licence VARCHAR(50) NULL,
            portfolio VARCHAR(255) NULL,
            extra_activities JSONB NULL,
            skills JSONB NULL,
            certifications JSONB NULL,
            language JSONB NULL,
            tools JSONB NULL,
            reference INT NULL,
            is_primary_user CHAR(1) DEFAULT 'N' NOT NULL,
            branch_id INT NULL, -- Foreign Key to branches table
            status_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Set creation time
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- This will be updated via a trigger
            is_active BOOLEAN DEFAULT TRUE, -- Active status
            is_deleted BOOLEAN DEFAULT FALSE, -- Deleted status
            organization_id INT NOT NULL REFERENCES public.register_organization(organization_id),
            register_user_login_id INT NULL REFERENCES public.register_user_login(user_id), -- Foreign Key to register_user_login
            current_role_id INT,  -- Foreign key referencing users
            current_department_id INT,  -- Foreign key referencing users
            current_designation_id INT,  -- Foreign key referencing users
            current_job_type INT NULL,
            username VARCHAR(100) NULL,
            passport VARCHAR(20) NULL, -- Added Passport
            voter_id VARCHAR(20) NULL, -- Added Voter ID
            family_full_name TEXT NULL, -- Added Family Full Name
            family_relation VARCHAR(50) NULL, -- Added Family Relation
            family_occupation VARCHAR(100) NULL, -- Added Family Occupation
            family_age INT NULL, -- Added Family Age
            emergency_contact_full_name VARCHAR(255) NULL, -- Added Emergency Contact Full Name
            emergency_contact_relation VARCHAR(50) NULL, -- Added Emergency Contact Relation
            emergency_contact_phone_number VARCHAR(15) NULL, -- Added Emergency Contact Phone Number
            emergency_contact_occupation VARCHAR(15) NULL, -- Added Emergency Contact Phone Number
            profile_image TEXT NULL, -- Added Profile
            is_archive INT DEFAULT 0,
            generate_letters INT DEFAULT 0,
            employment_status_id integer,
            user_type character varying(20) COLLATE pg_catalog."default" DEFAULT 'employee'::character varying,
            job_opening_id integer,
            attendance_modes JSONB DEFAULT '{}'::JSONB,
            employee_weekoffs JSONB DEFAULT '[]'::JSONB,
            salary_increase_percentage character varying(50) COLLATE pg_catalog."default"

            -- CONSTRAINT fk_current_role FOREIGN KEY (current_role_id) REFERENCES ${schemaName}.organization_roles (role_id) ON DELETE CASCADE -- Foreign key constraint
          );
     `);
    }



    async insertUserTable(schemaName: string, user): Promise<string> {
        // Insert the user's info into the organization's schema user table

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await this.hashPassword(randomPassword);
        const userInsertQuery = `
        INSERT INTO ${schemaName}.users
        (first_name, last_name, personal_mail, phone_number, password, organization_id, register_user_login_id, is_primary_user,current_role_id,official_email,user_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11);`;

        await this.dataSource.query(userInsertQuery, [
            user.first_name,
            user.last_name,
            user.business_email,
            user.phone_number,
            hashedPassword,
            user.organization.organization_id,
            user.user_id,
            'Y',
            1,
            user.business_email,
            'user',
        ]);

        return randomPassword;
    }


    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}