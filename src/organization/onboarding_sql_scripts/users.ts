import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';


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
            last_name VARCHAR(255),
            business_email VARCHAR(255) UNIQUE NOT NULL,
            phone_number VARCHAR(50),
            password VARCHAR(255),
            organization_id INT NOT NULL REFERENCES public.register_organization(organization_id),
            register_user_login_id INT NOT NULL REFERENCES public.register_user_login(user_id), -- Foreign Key to register_user_login
            is_primary_user CHAR(1) DEFAULT 'N' NOT NULL
        );
        `);
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async  insertUserTable(schemaName: string,user): Promise<string> {
        // Insert the user's info into the organization's schema user table

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await this.hashPassword(randomPassword);
        const userInsertQuery = `
        INSERT INTO ${schemaName}.users 
        (first_name, last_name, business_email, phone_number, password, organization_id, register_user_login_id, is_primary_user)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;

        await this.dataSource.query(userInsertQuery, [
            user.first_name,
            user.last_name,
            user.business_email,
            user.phone_number,
            hashedPassword,
            user.organization.organization_id,
            user.user_id,
            'Y'
        ]);
 
        return hashedPassword;
    }
}