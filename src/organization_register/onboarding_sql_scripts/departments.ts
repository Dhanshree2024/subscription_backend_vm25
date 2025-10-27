import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DepartmentsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDepartmentsTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
        CREATE TABLE IF NOT EXISTS ${schemaName}.departments
            (
                department_id SERIAL PRIMARY KEY,
                department_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
                department_head_id integer,
                created_by_id integer,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                dept_description text COLLATE pg_catalog."default",
                linked_designations integer,
                is_active integer DEFAULT 1,
                is_deleted integer DEFAULT 0
                
            )

        `);
    }

    async  insertOrganizationDepartmentTable(schemaName: string, departments: { department_name: string }[]): Promise<void> {
        // Insert the user's info into the organization's schema user table
        const departmentInsertQuery = `
            INSERT INTO ${schemaName}.departments(department_name)VALUES ($1);
        `;
        
        await Promise.all(departments.map(dept => {
          return this.dataSource.query(departmentInsertQuery, [dept.department_name]);
        }));
    }
}