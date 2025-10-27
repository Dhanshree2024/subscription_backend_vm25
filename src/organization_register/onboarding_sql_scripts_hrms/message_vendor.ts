import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class MessageVendorScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createMessageVendorTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.message_vendor (
                message_vendor_id SERIAL PRIMARY KEY,
                message_vendor_type VARCHAR(10) CHECK (message_vendor_type IN ('SMS', 'WHATSAPP', 'EMAIL')),
                message_vendor_name VARCHAR(200),
                message_vendor_description VARCHAR(300),
                message_vendor_contact VARCHAR(20) NOT NULL,
                message_vendor_email VARCHAR(30),
                message_vendor_is_current SMALLINT NOT NULL DEFAULT 0,
                message_vendor_added_by INT,
                message_vendor_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                message_vendor_website_url VARCHAR(200),
                message_variable_start_with VARCHAR(15),
                message_variable_end_with VARCHAR(15),
                message_vendor_key VARCHAR(1000),
                message_vendor_username VARCHAR(50),
                message_vendor_password VARCHAR(50),
                message_vendor_other_details VARCHAR(500),
                message_vendor_redirect_url VARCHAR(250),
                message_vendor_is_active SMALLINT NOT NULL DEFAULT 1,
                message_vendor_is_deleted SMALLINT NOT NULL DEFAULT 0
            );

        `);
    }
}