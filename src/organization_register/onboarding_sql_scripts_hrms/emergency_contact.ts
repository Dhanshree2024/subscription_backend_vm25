import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EmergencyContactsScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createEmergencyContactsTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.emergency_contacts (
        emergency_contact_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        relation VARCHAR(50),
        phone_number VARCHAR(15),
        occupation VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE
      );
    `);
  }
}
