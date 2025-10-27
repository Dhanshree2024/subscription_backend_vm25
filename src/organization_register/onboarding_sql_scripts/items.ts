import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class ItemsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createItemsTable(schemaName: string): Promise<void> {

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_items
          (
              asset_item_id SERIAL PRIMARY KEY,
              main_category_id integer,
              sub_category_id integer,
              asset_item_name text COLLATE pg_catalog."default",
              asset_item_description text COLLATE pg_catalog."default",
              parent_organization_id integer,
              added_by integer,
              is_active integer DEFAULT 1,
              is_deleted integer DEFAULT 0,
              created_at date,
              updated_at date,
              is_licensable boolean DEFAULT false,
              item_type item_type_enum,
              has_depreciation boolean,
              company_act_asset_life integer,
              it_act_asset_life integer,
              company_depreciation_rate integer,
              it_act_depreciation_rate integer,
              company_act_residual_value integer,
              it_act_residual_value integer,
              preffered_method integer,
              asset_item_icon text COLLATE pg_catalog."default",
              upload_documents boolean
              
          )
      `);
  }

  async insertAssetItemTable(
    schemaName: string,
    subCategories: { main_category_id: number, sub_category_id: number, asset_item_name: string, is_licensable: boolean, item_type: string }[]
  ): Promise<void> {
    const itemInsertQuery = `INSERT INTO ${schemaName}.asset_items(main_category_id, sub_category_id, asset_item_name,is_licensable,item_type) VALUES ($1,$2,$3,$4,$5);`;


    await Promise.all(
      subCategories.map(subCategory => {
        return this.dataSource.query(itemInsertQuery, [
          subCategory.main_category_id,
          subCategory.sub_category_id, // remove trailing spaces
          subCategory.asset_item_name.trim(),// remove trailing spaces
          subCategory.is_licensable,
          subCategory.item_type,
        ]);
      })
    );
  }


}