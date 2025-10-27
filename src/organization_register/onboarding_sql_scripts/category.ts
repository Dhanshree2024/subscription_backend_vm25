import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class CategoryScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createCategoryTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.asset_main_category
              (
                  main_category_id SERIAL PRIMARY KEY,
                  main_category_name text COLLATE pg_catalog."default",
                  main_category_description text COLLATE pg_catalog."default",
                  parent_organization_id integer,
                  added_by integer,
                  is_active integer NOT NULL DEFAULT 1,
                  is_deleted integer NOT NULL DEFAULT 0,
                  created_at date,
                  updated_at date,
                  main_category_icon text COLLATE pg_catalog."default" DEFAULT 'box'::text
                  
              )
        `);
    }

    async insertAssetMainCategoryTable(
        schemaName: string,
        categories: { main_category_name: string }[]
      ): Promise<void> {
        const categoryInsertQuery = `INSERT INTO ${schemaName}.asset_main_category(main_category_name) VALUES ($1);`;

        await Promise.all(
          categories.map(category => {
            return this.dataSource.query(categoryInsertQuery, [category.main_category_name]);
          })
        );
      }


}