import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  // Method to set schema dynamically
  async setSchema(schemaName: string): Promise<void> {
    if (!schemaName) {
      throw new Error('Schema name is required.');
    }

    // Set search path to the provided schema
    await this.dataSource.query(`SET search_path TO ${schemaName}`);
  }
}
