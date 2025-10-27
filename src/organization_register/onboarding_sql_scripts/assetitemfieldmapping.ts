import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class ItemFieldsMappingScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createItemFieldsMappingTable(schemaName: string): Promise<void> {
      
        await this.dataSource.query(`
            
      CREATE TABLE IF NOT EXISTS ${schemaName}.asset_items_fields_mapping
        (
           aif_mapping_id SERIAL PRIMARY KEY,
            asset_field_id integer NOT NULL,
            asset_item_id integer NOT NULL,
            asset_field_category_id numeric,
            aif_is_enabled integer DEFAULT 1,
            aif_is_mandatory integer DEFAULT 0,
            aif_is_active integer DEFAULT 1,
            aif_is_deleted integer DEFAULT 0,
            aif_added_by integer,
            aif_parent_organization_id integer,
            aif_created_at timestamp without time zone,
            aif_updated_at timestamp without time zone,
            aif_description text COLLATE pg_catalog."default"
            
        )
        `);
    }

    async insertItemFieldMappings(
  schemaName: string,
  mappings: { itemName: string; fieldName: string }[]
): Promise<void> {
  for (const mapping of mappings) {
    // Get item ID
    const [item] = await this.dataSource.query(
      `SELECT asset_item_id FROM ${schemaName}.asset_items WHERE asset_item_name = $1`,
      [mapping.itemName]
    );
    if (!item) continue;

    // Get field ID and its category ID
    const [field] = await this.dataSource.query(
      `SELECT asset_field_id, asset_field_category_id 
       FROM ${schemaName}.asset_fields 
       WHERE asset_field_name = $1`,
      [mapping.fieldName]
    );
    if (!field) continue;

    // Insert into mapping table
    await this.dataSource.query(
      `INSERT INTO ${schemaName}.asset_items_fields_mapping 
       (asset_item_id, asset_field_id, asset_field_category_id) 
       VALUES ($1, $2, $3)`,
      [item.asset_item_id, field.asset_field_id, field.asset_field_category_id]
    );
  }
}

}