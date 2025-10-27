import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DisciplinaryDocumentsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `employee_status` table in the specified schema and populates initial statuses.
   * @param schemaName - The schema where the table should be created.
   */
  async createDisciplinaryDocumentsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.disciplinary_documents (
            disciplinary_documents_id SERIAL PRIMARY KEY,
            employee_disciplinary_records_id INT NOT NULL,
            document_uploaded_by INT NOT NULL, -- User ID or reference to the user who added the document
            document_path TEXT NULL, -- Path where the document is stored
            file_name VARCHAR(255) NULL, -- Name of the document file
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
            is_active BOOLEAN DEFAULT TRUE, -- Indicates if the record is active
            is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the record is deleted
            is_verified BOOLEAN DEFAULT FALSE,
            verified_by INT,
            CONSTRAINT fk_employee_disciplinary_records_id FOREIGN KEY (employee_disciplinary_records_id) REFERENCES ${schemaName}.employee_disciplinary_records (employee_disciplinary_records_id), -- Foreign key constraint to users table
            CONSTRAINT fk_document_uploaded_by FOREIGN KEY (document_uploaded_by) REFERENCES ${schemaName}.users (user_id) -- Foreign key constraint to users table for the user who added the document

        );
      `);

      console.log(`Table ${schemaName}.disciplinary_documents created successfully.`);

    } catch (error) {
      console.error(`Error creating disciplinary_documents table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create disciplinary_documents table in schema ${schemaName}.`);
    }
  }
}
