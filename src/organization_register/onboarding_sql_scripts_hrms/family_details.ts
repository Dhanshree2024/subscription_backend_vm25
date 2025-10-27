import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class FamilyDetailsScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createFamilyDetailsTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.family_details (
        family_details_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES ${schemaName}.users(user_id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        relation VARCHAR(50),
        occupation VARCHAR(100),
        age INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE, 
        is_deleted BOOLEAN DEFAULT FALSE
      );
    `);
  }
}
