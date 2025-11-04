import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DesignationScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDesignationTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
          CREATE TABLE IF NOT EXISTS ${schemaName}.designations
            (
                designation_id SERIAL PRIMARY KEY,
                designation_name character varying(150) COLLATE pg_catalog."default" NOT NULL,
                created_by_id integer,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                desg_description text COLLATE pg_catalog."default",
                parent_department integer,
                is_active integer DEFAULT 1,
                is_deleted integer DEFAULT 0,
              
                CONSTRAINT designations_designation_name_key UNIQUE (designation_name)
            )

        `);
    }



     async insertDesignationTable(
    schemaName: string,
    designations: { parent_department: string; designation_name: string }[]
  ): Promise<void> {
    // Step 1: Fetch all department IDs and map them by name
    const departments = await this.dataSource.query(
      `SELECT department_id, department_name FROM ${schemaName}.departments`
    );

    const deptMap = departments.reduce((acc, dept) => {
      acc[dept.department_name.trim()] = dept.department_id;
      return acc;
    }, {} as Record<string, number>);

    // Step 2: Insert designations with correct parent_department IDs
    const insertQuery = `
      INSERT INTO ${schemaName}.designations (designation_name, parent_department)
      VALUES ($1, $2);
    `;

    await Promise.all(
      designations.map(async (desg) => {
        const parentDeptId = deptMap[desg.parent_department.trim()];
        if (!parentDeptId) {
          console.warn(`⚠️ Department "${desg.parent_department}" not found. Skipping "${desg.designation_name}".`);
          return;
        }

        await this.dataSource.query(insertQuery, [
          desg.designation_name.trim(),
          parentDeptId,
        ]);
      })
    );
  }
}


