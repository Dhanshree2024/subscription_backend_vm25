import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class assetDepreciationMethodsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }

    async createassetDepreciationMethodsScriptTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_depreciation_methods
                (
                    depreciation_method_id SERIAL PRIMARY KEY,
                    dep_method_name character(30) COLLATE pg_catalog."default",
                    created_at date,
                    updated_at date,
                    created_by integer,
                    updated_by integer,
                    
                    CONSTRAINT asset_depreciation_methods_created_by_fkey FOREIGN KEY (created_by)
                        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION
                        NOT VALID,
                    CONSTRAINT asset_depreciation_methods_updated_by_fkey FOREIGN KEY (updated_by)
                        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION
                        NOT VALID
                )
        `);
    }

    async insertDepreciationMethods(
        schemaName: string,
        methods: { dep_method_name: string }[]
    ): Promise<void> {
        const query = `
    INSERT INTO ${schemaName}.asset_depreciation_methods (dep_method_name)
    VALUES ($1)
    ON CONFLICT DO NOTHING;
  `;

        await Promise.all(
            methods.map(m => this.dataSource.query(query, [m.dep_method_name]))
        );
    }

}