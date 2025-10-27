import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersBranchPermissionScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the `users_branch_permissions` table in the specified schema.
   * @param schemaName - The schema where the table should be created.
   */
  async createUsersBranchPermissionsTable(schemaName: string): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.users_branch_permissions (
          branch_permission_id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          branches JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          is_active BOOLEAN DEFAULT TRUE,
          is_deleted BOOLEAN DEFAULT FALSE,

          CONSTRAINT fk_user FOREIGN KEY (user_id)
            REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE CASCADE,

          CONSTRAINT fk_created_by FOREIGN KEY (created_by)
            REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE SET NULL
        );
      `);

      console.log(`Table ${schemaName}.users_branch_permissions created successfully.`);
    } catch (error) {
      console.error(`Error creating users_branch_permissions table in schema ${schemaName}:`, error);
      throw new Error(`Failed to create users_branch_permissions table in schema ${schemaName}.`);
    }
  }
}
