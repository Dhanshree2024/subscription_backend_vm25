import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CompOffRequestsScript {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async createCompOffRequestsTable(schemaName: string): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.comp_off_requests (
        comp_off_id SERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES ${schemaName}.users(user_id),
        work_date DATE NOT NULL,
        unit VARCHAR,
        duration VARCHAR,
        start_time VARCHAR,
        end_time VARCHAR,
        expiry_date DATE,
        reason TEXT,
        remark TEXT,
        status VARCHAR DEFAULT 'PENDING',
        approved_by INT REFERENCES ${schemaName}.users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT REFERENCES ${schemaName}.users(user_id),
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        approved_on TIMESTAMP,
        cancelled_by INT REFERENCES ${schemaName}.users(user_id),
        cancelled_on TIMESTAMP,
        updated_at TIMESTAMP
      );
    `);
  }
}
