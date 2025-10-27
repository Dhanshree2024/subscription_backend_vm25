import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DocumentTypeScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDocumentTypeTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.document_type (
                document_type_id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
                document_type_name VARCHAR(255) NOT NULL, -- Name of the document type
                -- created_by INT NOT NULL, -- User ID or reference to the user who created the document type
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last update timestamp
                is_active BOOLEAN DEFAULT TRUE, -- Indicates if the document type is active
                is_deleted BOOLEAN DEFAULT FALSE, -- Indicates if the document type is deleted
                to_display BOOLEAN DEFAULT TRUE
              );

        `);

        await this.dataSource.query(`
          INSERT INTO ${schemaName}.document_type (document_type_name,to_display)
          VALUES 
          ('Resume',true),
          ('Pan card',true),
          ('Aadhar card',true),
          ('Light bill',true),
          ('Salary Slip',true),
          ('Experience Letter',true),
          ('Previous Offer Letter',true),
          ('Bank Pass Book',true),
          ('Relieving Letter',true),
          ('Company Offer letter',false),
          ('Company joining letter',false),
          ('Company appointment Letter',false);
        `);
    }
}