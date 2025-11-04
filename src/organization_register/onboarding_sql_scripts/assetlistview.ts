import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetListViewScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createAssetStockSerialsView(schemaName: string): Promise<void> {
    const viewName = `${schemaName}.v_asset_stock_serials`;

    const query = `
    CREATE OR REPLACE VIEW ${viewName} AS
    SELECT 
        serial.asset_stocks_unique_id,
        serial.stock_serials,
        serial.license_key,
        serial.system_code,
        serial.depreciation_start_date,
        serial.depreciation_end_date,
        serial.asset_id,
        serial.asset_item_id,
        serial.stock_id,
        asset.asset_title,
        asset.asset_is_active,
        asset.asset_location,
        asset.asset_main_category_id AS main_category_id,
        asset.asset_sub_category_id AS sub_category_id,
        main_cat.main_category_name AS asset_main_category_name,
        sub_cat.sub_category_name AS asset_sub_category_name,
        location.location_code,
        item.asset_item_name,
        stock.purchase_date,
        mapping.asset_managed_by,
        (managed_user.first_name::text || ' '::text) || managed_user.last_name::text AS managed_by_user_name,
        mapping.asset_used_by,
        (used_user.first_name::text || ' '::text) || used_user.last_name::text AS used_by_user_name,
        mapping.department_id,
        dept.department_name,
        mapping.branch_id,
        br.branch_name
    FROM ${schemaName}.asset_stock_serials serial
        LEFT JOIN ${schemaName}.assets asset ON serial.asset_id = asset.asset_id
        LEFT JOIN ${schemaName}.asset_main_category main_cat ON asset.asset_main_category_id = main_cat.main_category_id
        LEFT JOIN ${schemaName}.asset_sub_category sub_cat ON asset.asset_sub_category_id = sub_cat.sub_category_id
        LEFT JOIN ${schemaName}.asset_locations location ON asset.asset_location = location.location_id
        LEFT JOIN ${schemaName}.asset_items item ON serial.asset_item_id = item.asset_item_id
        LEFT JOIN ${schemaName}.stocks stock ON serial.stock_id = stock.stock_id
        LEFT JOIN LATERAL (
          SELECT am.mapping_id,
                 am.asset_id,
                 am.system_code,
                 am.mapping_type,
                 am.asset_used_by,
                 am.asset_managed_by,
                 am.branch_id,
                 am.status_type_id,
                 am.description,
                 am.department_id,
                 am.reallocation_mapping_id,
                 am.created_by,
                 am.updated_by,
                 am.created_at,
                 am.updated_at,
                 am.is_active,
                 am.is_deleted,
                 am.quantity,
                 am.unique_id,
                 am.stock_id
          FROM ${schemaName}.asset_mapping am
          WHERE am.asset_id = serial.asset_id
          ORDER BY am.mapping_id DESC
          LIMIT 1
        ) mapping ON true
        LEFT JOIN ${schemaName}.users managed_user ON mapping.asset_managed_by = managed_user.user_id
        LEFT JOIN ${schemaName}.users used_user ON mapping.asset_used_by = used_user.user_id
        LEFT JOIN ${schemaName}.departments dept ON mapping.department_id = dept.department_id
        LEFT JOIN ${schemaName}.branches br ON mapping.branch_id = br.branch_id;
    `;

    try {
      await this.dataSource.query(query);
      console.log(`✅ View ${viewName} created successfully`);
    } catch (err) {
      console.error(`❌ Error creating view ${viewName}:`, err);
      throw err;
    }
  }
}
