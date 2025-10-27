import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class BranchesScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createBranchesTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.branches (
                branch_id SERIAL PRIMARY KEY, -- Primary Key with auto-increment
                branchname VARCHAR(255) NOT NULL,
                branchsortname VARCHAR(255) NOT NULL,
                branchContactno VARCHAR(10),
                branchEmail VARCHAR(255),
                branchAddressStreet VARCHAR(255),
                branchAddressLandmark VARCHAR(255),
                branchAddressCity VARCHAR(100),
                branchAddressState VARCHAR(100),
                branchAddressPincode VARCHAR(20),
                branchAddressCountry VARCHAR(100),
                gstin VARCHAR(15),
                establishdate DATE,
                telephone_number VARCHAR(20), -- Added Telephone Number
                branch_latitude DECIMAL(10, 7),
                branch_longitude DECIMAL(10, 7),
                
                users_first_name VARCHAR(100) NOT NULL,
                users_middle_name VARCHAR(100),
                users_last_name VARCHAR(100),
                phone_number VARCHAR(15) NOT NULL,
                alternative_number VARCHAR(15),
                users_business_email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record Creation Timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last Update Timestamp
                is_active BOOLEAN DEFAULT TRUE,
                is_delete BOOLEAN DEFAULT FALSE,
                is_primary BOOLEAN DEFAULT FALSE



            );

        `);
    }
}